import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet';
import api from '../../services/api';
import axios from 'axios';

import './styles.css';

import logo from '../../assets/logo.svg';

// array ou objeto: manualmente informar o tipo da variavel

interface item {
    id: number;
    title: string;
    image_url: string;
}

interface uf {
    id: number;
    sigla: string;
    nome: string;
}

interface city {
    id: number;
    nome: string;
}

const CreatePoint = () => {

    const [items, setItems] = useState<item[]>([]);
    const [ufs, setUfs] = useState<uf[]>([]);
    const [cities, setCitys] = useState<city[]>([]);

    const [initialPosition, setInitialPosition] = useState<[number, number]>([-15.8430724, -48.0307621]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
    })

    const history = useHistory();

    const [selectedUf, setSelectedUf] = useState('0');
    const [selectedCity, setSelectedCity] = useState('0');
    const [selectedItems, setSelectedItems] = useState<number[]>([])
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);

    useEffect(() => {
        api.get('items').then(response =>{
            setItems(response.data);
        })
    }, []);

    useEffect(() => {
        axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {    
            const ufs = response.data;
            setUfs(ufs);
        })
    }, []);

    useEffect(() => {
        // Carregar as cidades sempre q a uf mudar
        if(selectedUf === '0'){
            return;
        }
        axios.get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`).then(response => {
            const cities = response.data;
            setCitys(cities);
        })
    }, [selectedUf])

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            setInitialPosition([latitude, longitude]);
        });
    }, [])


    function handleSelectUf(event:ChangeEvent<HTMLSelectElement>) {
        setSelectedUf(event.target.value);
    }

    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedCity(event.target.value);
    }

    function handleMapClick(event:LeafletMouseEvent) {
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng
        ])
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>){
        const { name, value } = event.target;
        
        setFormData({ ...formData, [name]: value });
        history.push('/');
    }

    function handleSelectItem(id: number) {
        const alreadySelected = selectedItems.findIndex(item => item === id);

        if (alreadySelected >= 0) {
            const filteredItems = selectedItems.filter(item => item !== id)
            
            setSelectedItems(filteredItems);
        }
        else {
            setSelectedItems([ ...selectedItems, id ]);
        }
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        
        const {name, email, whatsapp, } = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;
        const items = selectedItems;

        const data = {
            name,
            email,
            whatsapp,
            uf,
            city,
            latitude,
            longitude,
            items
        }

        await api.post('points', data);

        alert('Ponto de coleta criado!');
    }

    return (

        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>
            
            <Link to='/'>
                <FiArrowLeft />
                Voltar para Home
            </Link>
            </header>

            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br/> ponto de coleta</h1>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input 
                            type="text"
                            name="name"
                            id="name"
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="field-group">
                    <div className="field">
                        <label htmlFor="email">E-mail</label>
                        <input 
                            type="email"
                            name="email"
                            id="email"
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="whatsapp">Whatsapp</label>
                        <input 
                            type="text"
                            name="whatsapp"
                            id="whatsapp"
                            onChange={handleInputChange}
                        />
                    </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker position={selectedPosition} />
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select 
                                name="uf" 
                                id="uf"
                                value={selectedUf} 
                                onChange={handleSelectUf}
                            >
                                <option value="0">Selecione uma UF</option>
                                {
                                    ufs.map(uf => (
                                        <option key={uf.id} value={uf.sigla}>{uf.sigla}</option>
                                    ))
                                }
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select 
                                name="city" 
                                id="city" 
                                value={selectedCity}
                                onChange={handleSelectCity}
                            >
                                <option value="0">Selecione uma cidade</option>
                                {
                                    cities.map(city => (
                                        <option key={city.id} value={city.nome}>{city.nome}</option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Filtro de coleta</h2>
                        <span>Selecione um ou mais itens abaixo</span>
                    </legend>
                    
                    <ul className="items-grid">
                        {items.map(item => (
                            <li 
                                key={item.id} 
                                onClick={
                                    () => handleSelectItem(item.id)
                                }
                                className={selectedItems.includes(item.id) ? 'selected' : ''}
                            >
                                <img src={item.image_url} alt={item.title}/>
                                <span>{item.title}</span>
                            </li>
                        ))}
                        
                        
                    </ul>
                </fieldset>
 
                <button type="submit"> Cadastrar ponto de coleta</button>
            </form>
        </div>
        
    )
}

export default CreatePoint