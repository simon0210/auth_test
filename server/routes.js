import Router from './router'

export default function routes(app) {
    app.use('/api/v1/', Router);
};
