const {
    ApolloServer,
    PubSub,
    AuthenticationError,
    UserInputError,
    ApolloError,
    SchemaDirectiveVisitor
} = require('apollo-server');
const gql = require('graphql-tag');
const {defaultFieldResolver, GraphQLString} = require('graphql')
const pubSub = new PubSub();
const NEW_ITEM = 'NEW_ITEM';

class LogDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field, details) {
        const resolver = field.resolve || defaultFieldResolver;
        field.args.push({
            type: GraphQLString,
            name: 'message'
        })
        field.resolve = (root, {message, ...rest}, ctx, info) => {
            const {message: schemaMessage} = this.args;
            console.log('⚡️hello', message|| schemaMessage);
            return resolver.call(this, root, rest, ctx, info);
        }
    }
}

const typeDefs = gql `
    directive @log(message: String = "my message") on FIELD_DEFINITION
    
    type User {
        id: ID! @log
        error: String! @deprecated
        username: String!
        createdAt: String!
    }
    
    type Settings {
        user: User!
        theme: String!
    }
    
    type Item {
        task: String!
    }
    
    input NewSettingsInput {
        user: ID!
        theme: String!
    }
    
    type Query {
        me: User!
        settings(id: ID!): Settings!
    }
    
    type Mutation {
        settings(input: NewSettingsInput!): Settings!
        createItem(task: String!): Item!
    }
    
    type Subscription {
        newItem: Item
    }
`

const items = [];
const resolvers = {
    Query: {
        me() {
            return {
                id: '12',
                username: 'test_user',
                createdAt: 12344
            }
        },
        settings(_, {user}) {
            return {
                user,
                theme: 'Light'
            };
        }
    },

    Mutation: {
        settings(_, {input}) {
            return input;
        },
        createItem(_, {task}) {
            const item = {task};
            pubSub.publish(NEW_ITEM, {newItem: item});
            return item;
        }
    },
    Settings: {
        user() {
            return {
                id: '12',
                username: 'test_user',
                createdAt: 12344
            }
        }
    },
    Subscription: {
        newItem: {
            subscribe: () => pubSub.asyncIterator(NEW_ITEM)
        }
    },
    User: {
        error() {
            return ('Not authenticated');
        }
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
    schemaDirectives: {
        log: LogDirective
    },
    context({connection}) {
        if (connection) {
            return {...connection.context}
        }
    },
    subscriptions: {
        onConnect(params){}
    }
});

server.listen(4001).then(({url}) => console.log(`Server at ${url}`));