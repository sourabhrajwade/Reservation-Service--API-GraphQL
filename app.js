const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const port = 3000;

const Event = require('./models/event');
const User = require('./models/user');

const app = express();

const events = [];

app.use(bodyParser.json());
app.use(
  "/graphql",
  graphqlHTTP({
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
          return events.map(event => {
            return {...event._doc, _id: event.id}
          })
        })
      },
      createEvent: (args) => {
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price,
          date: new Date(args.eventInput.date),
          creator: '5fb7dd5db7ffe91a8cc3963e'
        })
        let createdEvent;
        return event
        .save()
        .then(result => {
          createdEvent = { ...result._doc,password:null, _id: result.id}; 
          return User.findById('5fb7dd5db7ffe91a8cc3963e')
          
          return {...result._doc,_id: result._doc._id.toString()};

        }).then(user => {
          if (user) {
            throw new Error('User exits already.')
          }
          user.createEvent.push(event);
          return user.save();
        })
        .catch(errr => {
          console.log(errr);
          throw errr;
        })
        
      },
      createUser: (args) => {
        return User.findOne({email: args.userInput.email})
        .then(user => {
          if(user) {
            throw new Error('User already exist')
          }
          
          return bcrypt.hash(args.userInput.password, 12)
        })
       .then(
          hashedpassword => {
            const user = new User({
              email: args.userInput.email,
              password: hashedpassword
            });
            return user.save();
          }
        ).then(result => {
          return createdEvent;
        })
        .catch(err => {console.log(err)})
        
      }
    },
    graphiql: true,
  })
);


const DB = `mongodb+srv://${process.env.DATABASE_UR}:${process.env.DATABASE_PW}@cluster0.q3ggb.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

mongoose.connect(DB, {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology:true})
.then(() => {console.log("DB connected successfully!"); app.listen(port);}).catch(err => {
  console.log(err);
})
