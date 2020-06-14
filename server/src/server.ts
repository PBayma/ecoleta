import express, { json } from 'express';
import cors from 'cors';
import routes from './routes';
import path from 'path'

const app = express();

app.use(cors());
app.use(express.json());
app.use(routes);

app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

app.get('/', (request, response) => {

    return response.json({ message: 'Hello World'});
})



app.listen(3333); 