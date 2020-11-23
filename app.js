const express = require("express");
const bodyParser = require("body-parser");
const { graphqlHTTP } = require("express-graphql");
const mongoose = require("mongoose");
const port = 3000;
const graphQlSchema = require('./graphql/schema/index');
const graphQlResolvers = require('./graphql/resolvers/index');

const app = express();

app.use(bodyParser.json());
app.use(
  "/graphql",
  graphqlHTTP({
    schema:graphQlSchema,
    rootValue: graphQlResolvers,
    graphiql: true,
  })
);

const DB = `mongodb+srv://${process.env.DATABASE_UR}:${process.env.DATABASE_PW}@cluster0.q3ggb.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB connected successfully!");
    app.listen(port);
  })
  .catch((err) => {
    console.log(err);
  });
