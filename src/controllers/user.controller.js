import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"

const registerUser = asyncHandler( async(req , res) => {
    
    // steps for registering a user 
    // 1. get user details from frontend
    // 2. validate the details that came from frontnend
    // 3. check if user already exist or not through 'username' or 'email'
    // 4. check for images, check for avatar
    // 5. after checking upload the images into cloudinary
    // 6. create user object , create entry in DB
    // 7. remove password and refresh token for response
    // 8. after following steps, check if the user is created or not
    // 9.check for the return response

    const {fullName , email , password , usename} = req.body
    console.log("Email is : ", email)

    // 1. get user details from frontend
    if ([fullName , email , password , usename].some((field) => field?.trim() === "" )) {
        throw new ApiError(400 , "All fields are required")
    }

    
    // 3. check if user already exist or not through 'username' or 'email'
    const existedUser = User.findOne({
        $or : [{email}, {password}]
    })
    if (existedUser) {
        throw new ApiError(409 , "User with email or username already exists")
    }
})

export default registerUser