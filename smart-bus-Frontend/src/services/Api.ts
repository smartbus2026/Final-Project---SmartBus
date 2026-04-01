import axios from "axios"; 

const Api = axios.create({
  baseURL: "https://api.example.com", 
  headers: {
    "Content-Type": "application/json",
  },
});

export default Api;