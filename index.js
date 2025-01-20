import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import bodyParser from 'body-parser'
import { randomUUID } from 'crypto'

const users_database = new Map()
const exercises_database = new Map()

const app = express()

const __dirname = path.resolve();
dotenv.config()

app.use(cors())

app.use(express.static('public'))

app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/index.html'))
});

// users context
app.post('/api/users', (req, res) => {
  if (!req.body.username) {
    return res
      .send({ error: 'username is required' })
      .status(400)
  }
  
  const response = {
    _id: randomUUID(),
    username: req.body.username,
  }

  users_database.set(response._id, response)

  res
    .send(response)
    .status(201)
})

app.get('/api/users', (req, res) => {
  res
    .send(Array.from(users_database.values()))
    .status(200)
})

app.post('/api/users/:_id/exercises', (req, res) => {
  const user = users_database.get(req.params._id)
  
  if (!user) {
    return res
      .send({ error: 'user not found' })
      .status(404)
  }

  if (!req.body.description) {
    return res
      .send({ error: 'description is required' })
      .status(400)
  }

  if (!req.body.duration) {
    return res
      .send({ error: 'duration is required' })
      .status(400)
  }

  const exercise = {
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: req.body.date ? new Date(req.body.date) : new Date(),
  }

  const exercises = exercises_database.get(user._id) || []
  exercises.push(exercise)
  exercises_database.set(user._id, exercises)

  const response = {
    _id: user._id,
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
  }

  res
    .send(response)
    .status(201)
});

app.get('/api/users/:_id/logs', (req, res) => {
  const user = users_database.get(req.params._id)

  console.log(req.params._id)
  console.log(req.query.from, req.query.to, req.query.limit)

  if (!user) {
    return res
      .send({ error: 'user not found' })
      .status(404)
  }

  const from = req.query.from ? new Date(req.query.from) : new Date(0)

  const to = req.query.to ? new Date(req.query.to) : new Date()
  
  const limit = req.query.limit ? req.query.limit : undefined

  const exercises = exercises_database.get(user._id) || []
  
  console.log("All exercises:", exercises)
  
  let filteredExercises = exercises.filter(exercise => {
    return exercise.date >= from && exercise.date <= to
  })

  if (limit) {
    filteredExercises = filteredExercises.slice(0, limit)
  }

  const response = {
    _id: user._id,
    username: user.username,
    count: exercises.length,
    log: filteredExercises.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    })),
  }

  console.log("reponse:" , response);

  res
    .send(response)
    .status(200)
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
