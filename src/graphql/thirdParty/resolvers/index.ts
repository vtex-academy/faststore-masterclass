import collectionShelfResolver from "./collectionShelf";

const resolvers = {
  Query: {
    ...collectionShelfResolver.Query,
  },
};

export default resolvers;
