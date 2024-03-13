// wrapper with promise
const asyncHandler = (requestHandler) => {
    (req , res , next) => { 
        Promise
        .resolve(requestHandler(req , res , next))
        .catch((err) => next(err)) 
    }
}

export {asyncHandler}




/*
// wrapper with try catch
const asyncHandler = (fn) => async(res , req , next) => {
    try {
        fn(res , req , next)
    } catch (error) {
        res.status(err.code || 500).JSON({
            success : false,
            message : err.message
        })
    }
}
*/