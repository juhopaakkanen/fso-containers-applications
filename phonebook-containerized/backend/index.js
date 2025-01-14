require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const { Person } = require('./mongo')

const app = express()

app.use(express.json())
app.use(express.static('build'))
app.use(cors())

morgan.token('body', (request) => {
  return JSON.stringify(request.body)
})
app.use(
  morgan(
    ':method :url :status :res[content-length] - :response-time ms - :body'
  )
)

app.get('/info', (request, response, next) => {
  const date = new Date()
  Person.find({})
    .then((persons) => {
      response.send(
        `<p>Phone book has info for ${persons.length} people<br><br> ${date}</p>`
      )
    })
    .catch((error) => next(error))
})

app.get('/persons', (request, response, next) => {
  Person.find({})
    .then((persons) => {
      response.json(persons)
    })
    .catch((error) => next(error))
})

app.get('/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch((error) => next(error))
})

app.delete('/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(() => {
      response.status(204).end()
    })
    .catch((error) => next(error))
})

const randomId = () => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)

app.post('/persons', (request, response, next) => {
  const body = request.body

  const person = new Person({
    name: body.name,
    number: body.number,
    id: randomId()
  })

  person
    .save()
    .then((savedPerson) => {
      response.json(savedPerson)
    })
    .catch((error) => next(error))
})

app.put('/persons/:id', (request, response, next) => {
  const { name, number } = request.body

  Person.findByIdAndUpdate(
    request.params.id,
    { name, number },
    { number: number, runValidators: true, contex: 'query' }
  )
    .then((updatedPerson) => {
      response.json(updatedPerson)
    })
    .catch((error) => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
