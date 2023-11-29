const {ApolloServer} = require('apollo-server')
const typeDefs = require('./typedefs')
const resolvers = require('./resolvers')
const {createToken, getUserFromToken} = require('./auth')
const db = require('./db')
const { FormatDateDirective, AuthorizationDirective, AuthenticationDirective } = require('./directives');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives: {
    date_format: FormatDateDirective,
    authentication: AuthenticationDirective,
    authorization: AuthorizationDirective
  },
  context({req, connection}) {
    const context = {...db};
    if (connection) {
      return {...context, ...connection.context}
    }
    const token = req.headers.authorization
    const user = getUserFromToken(token)
    return {...context, user, createToken}
  },
  subscriptions: {
    onConnect(params){
      const token = params.authorization
      const user = getUserFromToken(token)
      if (!user) {
        throw new Error('nope');
      }
      return {user};
    }
  }
})

server.listen(4000).then(({url}) => {
  console.log(`🚀 Server ready at ${url}`)
})
