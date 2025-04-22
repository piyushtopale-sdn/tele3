const checkCredit = (req) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject('No sufficient credits');
        }, 500);
    })
}

const setupCreditCheck = (app, routes) => {
    routes.forEach(r => {
        if (r.creditCheck) {
            app.use(r.url, function(req, res, next) {
                checkCredit(req).then(() => {
                    next();
                }).catch((error) => {
                    res.status(402).send({error});
                })
            });
        }
    })
}

exports.setupCreditCheck = setupCreditCheck