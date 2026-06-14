import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || '';

let clientPromise: Promise<MongoClient | null>;

if (!uri) {
	// No Mongo configured; export a resolved null so consumers can fallback to file DB.
	clientPromise = Promise.resolve(null);
} else {
	let client: MongoClient;

	if (process.env.NODE_ENV === 'development') {
		// @ts-ignore global caching for dev hot-reload
		if (!(global as any)._mongoClientPromise) {
			client = new MongoClient(uri);
			// store promise on global for hot reloads
			(global as any)._mongoClientPromise = client.connect();
		}
		// @ts-ignore
		clientPromise = (global as any)._mongoClientPromise;
	} else {
		client = new MongoClient(uri);
		clientPromise = client.connect();
	}
}

export default clientPromise;
