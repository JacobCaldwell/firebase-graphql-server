import * as admin from 'firebase-admin';
const functions = require("firebase-functions");
import * as express from 'express';

const serviceAccount = require('../serviceAccount.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://fir-graphql-test-79d16-default-rtdb.firebaseio.com",
    storageBucket: "fir-graphql-test-79d16.appspot.com"
})


const { ApolloServer, ApolloError, gql } = require('apollo-server-express');

const db = admin.firestore()

const typeDefs = gql`
    type Query {
        ingredients(name: String): [Ingredient]
        recipes(name: String): [Recipes]
    }

    type Ingredient {
        fdcId: Int
        name: String
        nutrients(name: [String]): [Nutrients]
    }

    type Nutrients {
        amount(units: String): Float
        name: String
        units: String
    }

    type RecipeIngredient {
        amount: Float
        item: Ingredient
    }

    type Recipes {
        name: String
        description: String
        rating: Float
        cooktime: Int
        ingredients: [RecipeIngredient]
    }

`

const resolvers = {
    Query: {
        ingredients: async (_: null, args: any) => {
            try {
                return await db.collection('ingredients')
                    .where('name', '==', args.name)
                    .get()
                    .then(data => data.docs.map(docs => docs.data()))
            } catch (error) {
                throw new ApolloError(error)
            }
        },
        recipes: async (_: null, args: any) => {
            try {
                return await db.collection('recipes')
                    .where('name', '==', args.name)
                    .get()
                    .then(data => data.docs.map(docs => docs.data()))
            } catch (error) {
                throw new ApolloError(error)
            }
        },

    },

    Ingredient: {
        name: (parent: any, _: any) => (parent.name),
        fdcId: (parent: any, _: any) => (parent.fdcId),
        nutrients: (parent: any, args: any) => {
            return parent.nutrients.filter((nutrient: any) => {
                return args.name ? args.name.includes(nutrient.name) : true
            })
        },
    },

    Nutrients: {
        amount: (parent: any, _: any) => parent.amount,
        name: (parent: any, _: any) => parent.name,
        units: (parent: any, _: any) => parent.units,
    },

    Recipes: {
        name: (parent: any, _: any): string => parent.name,
        description: (parent: any, _: any): string => parent.description,
        rating: (parent: any, _: any): number => parent.rating,
        cooktime: (parent: any, _: any): number => parent.cooktime,
        ingredients: (parent: any, _: any): number => parent.ingredients,
    },

    RecipeIngredient: {
        amount: (parent: any, _: any) => parent.amount,
        item: async (parent: any, _: any) => {
            return await parent.ingredient
                .get()
                .then((doc: any) => doc.data())
        }
    }

}

const app = express();
const server = new ApolloServer({ typeDefs, resolvers });
server.applyMiddleware({ app, path: "/", cors: true });
exports.graphql = functions.https.onRequest(app);