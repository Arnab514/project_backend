import { asyncHandler } from "../utils/asyncHandler.js";

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
})

export default registerUser