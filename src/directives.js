const { SchemaDirectiveVisitor, AuthenticationError} = require('apollo-server')
const { defaultFieldResolver, GraphQLString } = require('graphql')
const {formatDate} = require('./utils')

class FormatDateDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field, details) {
        field.args.push({
            type: GraphQLString,
            name: 'format'
        })

        const resolver = field.resolve || defaultFieldResolver;
        const { format: defaultFormat } = this.args;
        field.resolve = async (root, {format, ...rest}, ctx, info) => {
            const result = await resolver.call(this, root, rest, ctx, info);
            console.log(result)
            return formatDate(result, format || defaultFormat);
        }

        field.type = GraphQLString;
    }
}

class AuthenticationDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field, details) {
        const resolver = field.resolve || defaultFieldResolver;
        field.resolve = async (root, args, context, info) => {
            if (!context.user) {
                throw new AuthenticationError('not authenticated');
            }

            return resolver(root, args, context, info);
        }
    }
}

class AuthorizationDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field, details) {
        const resolver = field.resolve || defaultFieldResolver;
        const {role} = this.args;
        field.resolve = async (root, args, context, info) => {
            if (context.user.role !== role) {
                throw new AuthenticationError('Wrong role');
            }

            return resolver(root, args, context, info);
        }
    }

}

module.exports = {
    FormatDateDirective,
    AuthenticationDirective,
    AuthorizationDirective
};