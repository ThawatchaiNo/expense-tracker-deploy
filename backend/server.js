const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
const dayjs = require('dayjs')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// ─── PostgreSQL Connection ───────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// ─── Init Tables ─────────────────────────────────────────
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      icon TEXT DEFAULT '💰',
      color TEXT DEFAULT '#6366f1',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      note TEXT,
      date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `)

  const { rows } = await pool.query('SELECT COUNT(*) FROM categories')
  if (parseInt(rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO categories (name, icon, color) VALUES
        ('อาหาร', '🍜', '#f97316'),
        ('เดินทาง', '🚗', '#3b82f6'),
        ('ช้อปปิ้ง', '🛍️', '#ec4899'),
        ('สุขภาพ', '💊', '#22c55e'),
        ('บันเทิง', '🎬', '#a855f7'),
        ('สาธารณูปโภค', '💡', '#eab308'),
        ('อื่นๆ', '📦', '#6b7280')
      ON CONFLICT DO NOTHING
    `)
  }
  console.log('✅ Database initialized')
}

// ─── Serve Vue Frontend ──────────────────────────────────
const distPath = path.join(__dirname, '../frontend/dist')
app.use(express.static(distPath))

// ─── CATEGORIES ──────────────────────────────────────────
app.get('/api/categories', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM categories ORDER BY name')
  res.json({ success: true, data: rows })
})

app.post('/api/categories', async (req, res) => {
  const { name, icon, color } = req.body
  if (!name) return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อหมวดหมู่' })
  try {
    const { rows } = await pool.query(
      'INSERT INTO categories (name, icon, color) VALUES ($1, $2, $3) RETURNING *',
      [name, icon || '📦', color || '#6b7280']
    )
    res.status(201).json({ success: true, data: rows[0] })
  } catch {
    res.status(400).json({ success: false, message: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว' })
  }
})

// ─── EXPENSES ────────────────────────────────────────────
app.get('/api/expenses', async (req, res) => {
  const { date, month, year, category_id, limit = 50, offset = 0 } = req.query
  let where = [], params = []

  if (date) {
    params.push(date); where.push(`e.date = $${params.length}`)
  } else if (month && year) {
    params.push(parseInt(month)); params.push(parseInt(year))
    where.push(`EXTRACT(MONTH FROM e.date) = $${params.length - 1} AND EXTRACT(YEAR FROM e.date) = $${params.length}`)
  } else if (year) {
    params.push(parseInt(year)); where.push(`EXTRACT(YEAR FROM e.date) = $${params.length}`)
  }
  if (category_id) {
    params.push(parseInt(category_id)); where.push(`e.category_id = $${params.length}`)
  }

  const w = where.length ? `WHERE ${where.join(' AND ')}` : ''
  params.push(parseInt(limit)); params.push(parseInt(offset))

  const { rows } = await pool.query(`
    SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expenses e LEFT JOIN categories c ON e.category_id = c.id
    ${w} ORDER BY e.date DESC, e.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `, params)

  const metaParams = params.slice(0, params.length - 2)
  const { rows: meta } = await pool.query(
    `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as sum FROM expenses e ${w}`,
    metaParams
  )

  res.json({ success: true, data: rows, meta: { count: parseInt(meta[0].count), total: parseFloat(meta[0].sum) } })
})

app.get('/api/expenses/summary', async (req, res) => {
  const { month, year } = req.query
  const now = dayjs()
  const m = parseInt(month || now.month() + 1)
  const y = parseInt(year || now.year())

  const daily = await pool.query(`
    SELECT date::text, COALESCE(SUM(amount), 0) as total
    FROM expenses
    WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2
    GROUP BY date ORDER BY date
  `, [m, y])

  const byCategory = await pool.query(`
    SELECT c.name, c.icon, c.color, COALESCE(SUM(e.amount), 0) as total, COUNT(*) as count
    FROM expenses e LEFT JOIN categories c ON e.category_id = c.id
    WHERE EXTRACT(MONTH FROM e.date) = $1 AND EXTRACT(YEAR FROM e.date) = $2
    GROUP BY c.name, c.icon, c.color ORDER BY total DESC
  `, [m, y])

  const monthTotal = await pool.query(`
    SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
    FROM expenses WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2
  `, [m, y])

  const todayTotal = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date = $1`,
    [dayjs().format('YYYY-MM-DD')]
  )

  res.json({
    success: true,
    data: {
      monthTotal: parseFloat(monthTotal.rows[0].total),
      monthCount: parseInt(monthTotal.rows[0].count),
      todayTotal: parseFloat(todayTotal.rows[0].total),
      daily: daily.rows,
      byCategory: byCategory.rows
    }
  })
})

app.get('/api/expenses/:id', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expenses e LEFT JOIN categories c ON e.category_id = c.id WHERE e.id = $1
  `, [req.params.id])
  if (!rows[0]) return res.status(404).json({ success: false, message: 'ไม่พบรายการ' })
  res.json({ success: true, data: rows[0] })
})

app.post('/api/expenses', async (req, res) => {
  const { title, amount, category_id, note, date } = req.body
  if (!title || !amount || !date) return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบ' })
  const { rows } = await pool.query(
    'INSERT INTO expenses (title, amount, category_id, note, date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [title, parseFloat(amount), category_id || null, note || null, date]
  )
  const full = await pool.query(`
    SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expenses e LEFT JOIN categories c ON e.category_id = c.id WHERE e.id = $1
  `, [rows[0].id])
  res.status(201).json({ success: true, data: full.rows[0] })
})

app.put('/api/expenses/:id', async (req, res) => {
  const { title, amount, category_id, note, date } = req.body
  const { rows } = await pool.query(
    'UPDATE expenses SET title=$1, amount=$2, category_id=$3, note=$4, date=$5 WHERE id=$6 RETURNING *',
    [title, parseFloat(amount), category_id || null, note || null, date, req.params.id]
  )
  if (!rows[0]) return res.status(404).json({ success: false, message: 'ไม่พบรายการ' })
  const full = await pool.query(`
    SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expenses e LEFT JOIN categories c ON e.category_id = c.id WHERE e.id = $1
  `, [rows[0].id])
  res.json({ success: true, data: full.rows[0] })
})

app.delete('/api/expenses/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM expenses WHERE id = $1', [req.params.id])
  if (!rowCount) return res.status(404).json({ success: false, message: 'ไม่พบรายการ' })
  res.json({ success: true, message: 'ลบรายการสำเร็จ' })
})

// ─── Catch-all → Vue SPA ──────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

initDb().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
}).catch(err => {
  console.error('DB Error:', err)
  process.exit(1)
})
