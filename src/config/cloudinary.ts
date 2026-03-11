import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: 'de4itnpk6',
  api_key: '921374419321369',
  api_secret: '6jcFSFaPj6iozL2JJyH9zxkDYDA',
});

export default cloudinary;
