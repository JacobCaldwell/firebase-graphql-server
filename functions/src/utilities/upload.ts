import * as admin from "firebase-admin";
const { v4: uuidv4 } = require('uuid');

// console.log(uuid())

export const uploadFile = async (
    bucket: string,
    filePath: string,
    folderPath?: string) => {

    const newFileName = `${uuidv4()}.${filePath.split('.').pop()}`
    const destination = folderPath ? `${folderPath}/${newFileName}` : `${newFileName}`

    await admin
        .storage()
        .bucket(bucket)
        .upload(filePath, {
            destination,
            metadata: {
                cacheControl: "public, max-age=31536000",
            },
        })
    console.log(`${newFileName} uploaded to ${bucket}`);
};
