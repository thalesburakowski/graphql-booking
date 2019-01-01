const express = require('express')
const bodyParser = require('body-parser')
const graphqlHttp = require('express-graphql')
const { buildSchema } = require('graphql')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const Event = require('./models/event')
const User = require('./models/user')

const app = express()
const events = []

app.use(bodyParser.json())

app.use('/graphql', graphqlHttp({
    schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type User {
            _id: ID!
            email: String!
            password: String
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        input UserInput {
            email: String!
            password: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        events: () => {
            return Event.find()
                .then(events => {
                    console.log(events);

                    return events.map(event => {
                        return { ...event._doc, _id: event.id }
                    })
                })
                .catch(err => {
                    console.log(err);
                    throw err
                })
        },
        createEvent: (args) => {
            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: +args.eventInput.price,
                date: new Date(args.eventInput.date),
                creator: '5c2a3bf9ba28310e9013513f'
            })
            let createdEvent
            return event.save()
                .then(res => {
                    createdEvent = { ...res._doc, _id: event._doc._id.toString() }
                    return User.findById('5c2a3bf9ba28310e9013513f')
                })
                .then(user => {
                    if (!user) {
                        throw new Error('User not found.')
                    }                    
                    user.createdEvents.push(event)
                    return user.save()
                })
                .then(res => {
                    return createdEvent
                })
                .catch(err => {
                    console.log(err)
                    throw err
                })
        },
        createUser: async (args) => {
            try {
                const findedUser = await User.findOne({ email: args.userInput.email })
                if (findedUser) {
                    throw new Error('User exists already.')
                }

                const hashedPassword = await bcrypt.hash(args.userInput.password, 12)
                console.log(hashedPassword);

                const user = new User({
                    email: args.userInput.email,
                    password: hashedPassword
                })
                console.log(user);

                return user.save().then(result => {
                    console.log('aaaaa', result);

                    return { ...result._doc, password: null, _id: result.id }
                })
                console.log(result);



            } catch (error) {
                console.log("ERROOOOOOOOO", error);

                throw error
            }


        }
    },
    graphiql: true
}))


mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-gr8jt.mongodb.net/${process.env.MONGO_DB}?retryWrites=true`)
    .then(() => {
        app.listen(3000, () => console.log('running'))
    })
    .catch(err => console.log(err))
