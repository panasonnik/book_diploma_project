export function saveLastPage(req,res,next) {

    if (req.method === "GET" && !req.xhr) {
        res.cookie("lastPage", req.originalUrl, { maxAge: 60 * 60 * 1000 });
    }
    next();
    
}