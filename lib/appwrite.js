import { Client, Account, ID, Avatars, Databases, Query } from "react-native-appwrite";

export const config = {
  endpoint: "https://cloud.appwrite.io/v1",
  platform: "com.jsm.aora",
  projectId: "66d96bca000a20feaa93",
  databaseId: "66d96d0800010746b936",
  userCollecionId: "66d96d2c00345b2c14b4",
  videosCollectionId: "66d96d5f000350a53bb8",
  storageId: "66d96ea40016e82dac99",
};

const {
  endpoint,
  platform,
  projectId,
  databaseId,
  userCollecionId,
  videosCollectionId,
  storageId,
} = config;

// Init your React Native SDK
const client = new Client();

client
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setPlatform(platform);

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);

export const createUser = async (email, password, username) => {
  try {
    const newAccount = await account.create(
        ID.unique(),
        email,
        password,
        username,
    )

    if (!newAccount) throw Error;

    const avatarUrl = avatars.getInitials(username)

    await signIn(email, password);

    const newUser = await databases.createDocument(
        databaseId,
        userCollecionId,
        ID.unique(),
        {
            accountId: newAccount.$id,
            email,
            username,
            avatar: avatarUrl,
        }
    )

    return newUser;
  } catch (error) {
    throw new Error(error);
  }
};


export const signIn = async (email, password) => {    
    try {
        const session = await account.createEmailPasswordSession(email, password);

        return session;
    } catch (error) {
        throw new Error(error);
    }
} 

export const getCurrentUser = async () => {
    try {
        const currentAccount = await account.get();

        if (!currentAccount) throw Error;

        const currentUser = await databases.listDocuments(
            databaseId, 
            userCollecionId, 
            [Query.equal('accountId', currentAccount.$id)]
        );

        if(!createUser) throw Error;

        return currentUser.documents[0];
    } catch (error) {
        console.log(error)
    }
}

export const getAllPosts = async () => {
  try {
   const posts = await databases.listDocuments(
      databaseId,
      videosCollectionId,
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}