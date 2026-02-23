const fs = require('fs');

const posts = 'https://jsonplaceholder.typicode.com/posts';
const users = 'https://jsonplaceholder.typicode.com/users';

const userCepMap = { 
    1: "01001000", 
    2: "30140071", 
    3: "20040002", 
    4: "40010000", 
    5: "70040900", 
    6: "80010000", 
    7: "90020000", 
    8: "69005010", 
    9: "66015000", 
    10:"64000000" 
};

// Busca posts da API
async function fetchPosts() {
    try {
        const response = await fetch(posts);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao buscar os posts:', error);
        return [];
    }
}

// Busca usuários da API
async function fetchUsers() {
    try {
        const response = await fetch(users);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao buscar os usuários:', error);
        return [];
    }
}

// Filtra os 20 posts com maior ID
function filter20Posts(allPosts) {
    return allPosts.sort((a, b) => b.id - a.id).slice(0, 20);
}

// Busca dados do CEP no ViaCEP

async function fetchCepData(cep) {
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
            return {
                city: null,
                state: null
            };
        }

        let city = null;
        let state = null;

        if (data.localidade) {
            city = data.localidade;
        }

        if (data.uf) {
            state = data.uf;
        }

        return {
            city: city,
            state: state
        };

    } catch (error) {
        return {
            city: null,
            state: null
        };
    }
}

// Função principal
async function main() {
    // 1. Busca todos os posts e usuários
    const allPosts = await fetchPosts();
    const allUsers = await fetchUsers();
    
    console.log(`Total de posts: ${allPosts.length}`);
    console.log(`Total de usuários: ${allUsers.length}`);

    // 2. Seleciona os 20 posts com maior ID
    const top20 = filter20Posts(allPosts);
    console.log(`Posts selecionados(top 20): ${top20.length}`);

    // 3. Processa cada post
    const result = [];

    for (const post of top20) {

        // Buscar autor
        let author = null;

        for (const user of allUsers) {
            if (user.id === post.userId) {
                author = user;
            }
        }

        // Buscar CEP
        let cep = userCepMap[post.userId];

        let city = null;
        let state = null;

        if (cep) {
            let cepData = await fetchCepData(cep);
            city = cepData.city;
            state = cepData.state;
        }

        let authorName = null;
        let authorEmail = null;

        if (author) {
            authorName = author.name;
            authorEmail = author.email;
        }

        result.push({
            postId: post.id,
            title: post.title,
            authorName: authorName,
            authorEmail: authorEmail,
            cep: cep ? cep : null,
            city: city,
            state: state
        });
    }
    const pasta = './output';
    const caminhoArquivo = './output/data.json';

    // Verifica se a pasta existe
    let pastaExiste = fs.existsSync(pasta);

    if (pastaExiste === false) {
        fs.mkdirSync(pasta);
    }

    // Converte o resultado para JSON
    let conteudo = JSON.stringify(result, null, 2);

    // Cria o arquivo
    fs.writeFileSync(caminhoArquivo, conteudo, 'utf8');

    console.log('Arquivo gerado com sucesso!');
    console.log('Total de posts:', result.length);
}

main();
