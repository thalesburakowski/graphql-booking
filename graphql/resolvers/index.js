const bcrypt = require('bcryptjs')

const Event = require('../../models/event')
const User = require('../../models/user')
const Booking = require('../../models/booking')


const user = async userId => {
    try {
        const user = await User.findById(userId)
        return {
            ...user._doc,
            _id: user.id,
            createdEvents: events.bind(this, user._doc.createdEvents)
        }
    } catch (error) {
        throw error
    }
}

const singleEvent = async eventId => {
    try {
        const event = await Event.findById(eventId)
        return {
            ...event._doc,
            _id: event.id,
            creator: user.bind(this, event.creator)
        }
    } catch (error) {
        throw error
    }
}

const events = async eventIds => {
    try {
        const events = await Event.find({ _id: { $in: eventIds } })
        return events.map(event => {
            return {
                ...event._doc,
                _id: event.id,
                date: new Date(event._doc.date).toISOString(),
                creator: user.bind(this, event.creator)
            }
        })
    } catch (error) {
        console.log(error);
        throw error
    }
}

module.exports = {
    events: async () => {
        try {
            const events = await Event.find()
            return events.map(event => {
                return {
                    ...event._doc,
                    _id: event.id,
                    date: new Date(event._doc.date).toISOString(),
                    creator: user.bind(this, event._doc.creator)
                }
            })
        } catch (error) {
            throw error
        }
    },
    bookings: async () => {
        try {
            const bookings = await Booking.find()
            return bookings.map(booking => {
                return {
                    ...booking._doc,
                    _id: booking.id,
                    user: user.bind(this, booking.user),
                    event: singleEvent.bind(this, booking._doc.event),
                    createdAt: new Date(booking._doc.createdAt).toISOString(),
                    updatedAt: new Date(booking._doc.updatedAt).toISOString()
                }
            })
        } catch (error) {
            throw error
        }
    },

    createEvent: async args => {
        const event = new Event({
            title: args.eventInput.title,
            description: args.eventInput.description,
            price: +args.eventInput.price,
            date: new Date(args.eventInput.date),
            creator: '5c2e533955de242cac8cfbdd'
        })
        let createdEvent
        try {
            const response = await event.save()
            createdEvent = {
                ...response._doc,
                _id: event._doc._id.toString(),
                date: new Date(event._doc.date).toISOString(),
                creator: user.bind(this, response._doc.creator)
            }
            const creator = await User.findById('5c2e533955de242cac8cfbdd')
            if (!creator) {
                throw new Error('User not found.')
            }
            creator.createdEvents.push(event)
            await creator.save()
            return createdEvent

        } catch (error) {
            console.log(error);
            throw error
        }

    },
    createUser: async (args) => {
        try {
            const existingUser = await User.findOne({ email: args.userInput.email })
            if (existingUser) {
                throw new Error('User exists already.')
            }
            const hashedPassword = await bcrypt.hash(args.userInput.password, 12)

            const user = new User({
                email: args.userInput.email,
                password: hashedPassword
            })
            const userSaved = await user.save()
            return { ...userSaved._doc, password: null, _id: userSaved.id }

        } catch (error) {
            console.log("ERRO", error);
            throw error
        }
    },
    bookEvent: async args => {
        const fetchedEvent = await Event.findOne({ _id: args.eventId })
        const booking = new Booking({
            user: '5c2e533955de242cac8cfbdd',
            event: fetchedEvent
        })
        const result = await booking.save()
        return {
            ...result._doc,
            _id: result.id,
            user: user.bind(this, booking.user),
            event: singleEvent.bind(this, booking._doc.event),
            createdAt: new Date(result._doc.createdAt).toISOString(),
            updatedAt: new Date(result._doc.updatedAt).toISOString()
        }
    },
    cancelBooking: async args => {
        try {
            const booking = await Booking.findById(args.bookingId).populate('event');
            console.log(booking);
            
            const event = {
                ...booking.event._doc,
                _id: booking.event.id,
                creator: user.bind(this, booking.event._doc.creator)
            };
            await Booking.deleteOne({ _id: args.bookingId });
            return event;
        } catch (err) {
            throw err;
        }
    }
}
