import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './src/config/db.js'
import routes from './src/routes/index.js'
import errorHandler from './src/middleware/errorHandler.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

connectDB()

app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api', routes)

app.get('/api/health', (req, res) => res.json({ status: 'Metadesk Global API running' }))

app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`🚀 Metadesk Global API running on port ${PORT}`))
