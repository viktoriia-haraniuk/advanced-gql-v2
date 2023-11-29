const resolvers = require('../src/resolvers')
const {Post} = require("../src/resolvers");

describe('resolvers', function () {
    test('feed', () => {
        const result = resolvers.Query.feed(null, null, {models: {Post: {findMany() {
            return ['hello there', 'General Kenobi']
        }}}})

        expect(result).toEqual(['hello there', 'General Kenobi'])
    })
});