import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongooses from "mongoose";


// method generating access and refresh token
const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken , refreshToken}
    } 
    catch (error) {
        throw new ApiError(500 , "Something went wrong while generating the access and refresh token")
    }
}


const registerUser = asyncHandler (async(req , res) => {
    
    // steps for registering a user 
    // 1. get user details from frontend
    // 2. validate the details that came from frontnend
    // 3. check if user already exist or not through 'username' or 'email'
    // 4. check for images, check for avatar
    // 5. after checking upload the images into cloudinary
    // 5.1 check if the avatar is successfully uploaded or not
    // 6. create user object , create entry in DB
    // 7. remove password and refresh token for response
    // 8. after following steps, check if the user is created or not
    // 9. check for the return response

    const {fullName , email , password , username} = req.body
    // console.log("Email is : ", email)

    // 1. get user details from frontend
    if (
        [fullName , email , password , username].some((field) => field?.trim() === "" )
    ) {
        throw new ApiError(400 , "All fields are required")
    }

    
    // 3. check if user already exist or not through 'username' or 'email'
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409 , "User with email or username already exists")
    }

    // 4. check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    
    if (!avatarLocalPath) {
        throw new ApiError(400 , "Avatar is required")
    }


    // 5. after checking upload the images into cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    // 5.1 check if the avatar is successfully uploaded or not
    if(!avatar){
        throw new ApiError(400 , "Avatar is required")
    }


    // 6. create user object , create entry in DB
    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "" ,
        email,
        password,
        username : username.toLowerCase()
    })
    
    
    // 7. checking if the user is created in the database by finding the default mongodb _id and then after successful finding , remove password and refresh token for response    
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" 
    )


    // 8. after following steps, check if the user is created or not
    if (!createdUser) {
        throw new ApiError(500 , "Something went wrong, while registering the user")
    }


    // 9. check for the return response
    return res.status(200).json(
        new ApiResponse(201 , createdUser , "User is registered succesfully")
    )

})


const loginUser = asyncHandler (async(req , res) => {
    // Step 1 - get data from req.body
    // Step 2 - username or email 
    // Step 3 - find the user according to the given username or email
    // Step 4 - check the given password is correct or not
    // Step 5 - if the password is correct than generate the access and refresh token
    // Step 6 - send cookies

    // Step 1 - get data from req.body
    const {email , password , username} = req.body

    // Step 2 - username or email
    if(!username && !email){
        throw new ApiError(400 , "email and username is required to login")
    }
    
    // Step 3 - find the user according to the given username or email    
    const user = await User.findOne({
        $or: [{username} , {email}]
    })

    if (!user) {
        throw new ApiError(404 , "User does not exist")
    }

    // Step 4 - check the given password is correct or not
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401 , "Invalid user credentials, password is incorrect")
    }

    // Step 5 - if the password is correct than generate the access and refresh token
    const {accessToken , refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    // Step 6 - send cookies
    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser , accessToken , refreshToken
            },
            "User logged in successfully"
        )
    )
})


const logoutUser = asyncHandler (async(req , res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )
    
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(new ApiResponse(200, {}, "User logged out successfuly"))
})

const refreshAccessToken = asyncHandler (async(req , res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401 , "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(400 , "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401 , "Refresh token is invalid or used")
        }
    
        const options = {
            httpOnly : true,
            secure : true, 
        }
    
        const {accessToken , newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        res
        .status(200)
        .cookie("accessToken" , accessToken , options)
        .cookie("refreshToken" , newRefreshToken , options)
        .json(
            new ApiResponse(
                200,
                {accessToken , refreshToken : newRefreshToken},
                "Accesstoken refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401 , error?.message||"Invalid")
    }
})

export {registerUser , loginUser , logoutUser , refreshAccessToken}