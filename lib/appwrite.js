import { Client, Account, ID, Avatars, Databases, Query, Storage } from "react-native-appwrite";

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
const storage = new Storage(client);

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

export const getLatestPosts = async () => {
  try {
   const posts = await databases.listDocuments(
      databaseId,
      videosCollectionId,
      [Query.orderDesc('$createdAt', Query.limit(7))]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export const searchPosts = async (query) => {
  try {
   const posts = await databases.listDocuments(
      databaseId,
      videosCollectionId,
      [Query.search('title', query)]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export const getUserPosts = async (userId) => {
  try {
   const posts = await databases.listDocuments(
      databaseId,
      videosCollectionId,
      [Query.equal('creator', userId)]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export const signOut = async () => {
  try {
    const session = await account.deleteSession('current');

    return session;
  } catch (error) {
    throw new Error(error)
  }
}

export const getFilePreview = async (fileId, type) => {
  let fileUrl;
  try {
    if(type === 'video') {
      fileUrl = storage.getFileView(storageId, fileId)
    } else if (type === 'image') {
      // ( width, height, gravity, quality )
      fileUrl = storage.getFilePreview(storageId, fileId, 2000, 2000, 'top', 100) 
    } else {
      throw new Error('Invalid file type');
    }

    if(!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    throw new Error(error)   
  }
}

export const uploadFile = async (file, type) => {
  if(!file) return;

  const { mimeType, ...rest } = file;

  const asset = { type: mimeType, ...rest };

  try {
    const uploadFile = await storage.createFile(
      storageId,
      ID.unique(),
      asset,
    );

    const fileUrl = await getFilePreview(uploadFile.$id, type);

    return fileUrl;
  } catch (error) {
    throw new Error(error)
  }
}

export const createVideo = async (form) => {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, 'image'),
      uploadFile(form.video, 'video')
    ])

    const newPost = await databases.createDocument(
      databaseId,
      videosCollectionId,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        creator: form.userId
      }
    )

    return newPost;
  } catch (error) {
    throw new Error(error)
  }
}