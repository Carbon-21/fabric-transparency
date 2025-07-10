# Mecanismos de Transparência e Auditoria de Blockchains Permissionadas

**Resumo**: Blockchains permissionadas, como as privadas e consorciadas, são comuns em contextos que demandam controle de acesso. Porém, ao restringir os participantes da rede, diminuem a transparência do sistema. Diante disso, este trabalho propõe uma ferramenta de auditoria de blockchains permissionadas baseada no compartilhamento descentralizado do estado da blockchain via Interplanetary File System (IPFS). A partir de uma implementação utilizando Hyperledger Fabric, foram desenvolvidos mecanismos que permitem que entidades externas à rede blockchain possam identificar e se recuperar de alterações indevidas, ataques de visão fragmentada, uso de contratos inteligentes distintos dos declarados pela rede e execução de transações inválidas. 

**Objetivo do artefato**: Melhorar a transparência e auditoria de blockchains permissionadas, permitindo a detecção de diversos ataques e a recuperação de estados prévios a incidentes.

[Vídeo demonstrativo da ferramenta](https://drive.google.com/file/d/1R0STvbPl3kPC0T4u9xYVO_cgjlullgKw/view?usp=drive_link)

[Documentação do código-fonte](https://drive.google.com/file/d/1W0zhkyQhqrDDFnWHjlTvOsQOuTU2Mx75/view?usp=sharing)

# Estrutura do README.md
O README está dividido nas seguintes seções:
- [Selos considerados](#selos-considerados)
- [Informações básicas](#informações-básicas)
- [Dependências](#dependências)
- [Preocupações com segurança](#preocupações-com-segurança)
- [Instalação](#instalação)
- [Teste mínimo](#teste-mínimo)
- [Experimentos](#experimentos)
- [Licença](#license)

A organização do repositório, incluindo a estrutura de diretórios e arquivos principais, está documentada [aqui](https://drive.google.com/file/d/1W0zhkyQhqrDDFnWHjlTvOsQOuTU2Mx75/view?usp=sharing).

# Selos considerados

Todos os selos são considerados: Disponíveis, Funcionais, Sustentáveis e Reprodutíveis.

# Informações básicas
Para executar a ferramenta descrita no artigo e replicar os experimentos demonstrados no vídeo, é necessário utilizar o código presente neste repositório. A partir dele, é criada uma rede blockchain Hyperledger Fabric em um container Docker. Além disso, um portal de transparência, com suporte a IPFS, é disponibilizado em uma interface web. Mais detalhes sobre o ambiente de execução estão disponíveis na [documentação do código-fonte](https://drive.google.com/file/d/1W0zhkyQhqrDDFnWHjlTvOsQOuTU2Mx75/view?usp=sharing).

Recomenda-se o uso de uma máquina com ao menos 4Gb de memória e 2 CPUs. A maneira mais fácil de executar a ferramenta é através da [máquina virtual](...) (VM). Caso utilize a VM, recomenda-se que a máquina host tenha ao menos 8Gb de memória e 4 CPUs. É necessário ao menos 22Gb livres para armazenamento da imagem da VM. As dependências de software estão descritas na seção a seguir.

# Dependências

**Importante**: Ao usar a máquina virtual, todas as dependências abaixo já estão configuradas. Neste caso, é necessário baixar o VirtualBox.

Os seguintes requisitos de software são necessários para executar esta ferramenta:

- Docker 20.10.24+dfsg1
- Curl 7.88.1
- Go 1.19.8
- Node.js 22.15.0
- Npm 10.9.2
- Python 3.11.2
- Hyperledger Fabric 2.5.12

O sistema operacional recomendado é o **Debian 12**, utilizado durante o desenvolvimento da ferramenta.

# Preocupações com segurança

A execução do artefato não oferece riscos aos avaliadores.

# Instalação

A seguir, são descritas as etapas necessárias para se executar a aplicação, seja na VM ou não.

## Máquina Virtual

A forma mais fácil de usar esta ferramenta é através de uma máquina virtual:

1. Baixe o [VirtualBox](https://www.virtualbox.org/wiki/Downloads).
2. Baixe a [imagem Debian](...) contendo a ferramenta.
3. Extraia os arquivos.
4. Clique no arquivo vbox. Isso deve carregar a máquina no VirtualBox.
5. Ajuste os recursos da máquina em "settings" -> "general" -> "system". Recomendamos ao menos 4Gb e 2vCPUs, ou metade dos recursos disponíveis, idealmente.

**Importante**: a **senha** para usar a VM é **1234**

## Código-fonte

Caso não deseje utilizar a VM, primeiro instale as dependências (mencionadas na seção "[Dependências](#dependências)") em um ambiente Debian 12. Em seguida, baixe a ferramenta:

```
git clone https://github.com/Carbon-21/fabric-transparency.git
```

## Como usar a ferramenta

Se estiver executando a VM, a blockchain e a ferramenta de transparência já devem estar ativas e funcionando. Caso não esteja utilizando a VM ou queira reinicializar a blockchain e a ferramenta, execute:

```
cd fabric-transparency OU cd ~/Documents/fabric-transparency (se estiver usando a VM)
chmod +x init
./init
```

Você deverá ver uma mensagem indicando que a ferramenta está disponível em `http://localhost:4000`. Após isso, poderá acessar o portal de transparência por esse endereço, em um navegador web.

# Teste mínimo

Após executar o comando `./init` descrito acima, duas mensagens no terminal indicam o funcionamento da ferramenta:
- `Blockchain up and running!`: indica que a rede blockchain (rodando em container Docker) está funcional
- `SERVER STARTED [...] http://localhost:4000 [...]`: indica que a ferramenta de transparência está funcional através da interface web.

Após isso, ao abrir a interface web, os testes automáticos serão executados. Os resultados deste processo devem aparecer no topo da página. As seguintes linhas indicam testes bem-sucedidos (conforme descrito na seção a seguir):
- `The file hash matches the latest smart contract deployment hash, in block x! ✅`
- `The block hashes match those sent by the blockchain network! ✅`

# Experimentos

Esta seção descreve um passo a passo para a execução e obtenção dos resultados do artigo, apresentados na Seção 4, "Análise da ferramenta". O passo a passo é o mesmo executado no [vídeo demonstrativo da ferramenta](https://drive.google.com/file/d/1R0STvbPl3kPC0T4u9xYVO_cgjlullgKw/view?usp=drive_link) e, portanto, pode ser seguido a partir da descrição textual abaixo ou junto ao vídeo. Todas as reivindicações/funcionalidades podem ser executadas em um ambiente com ao menos 4Gb e 2vCPUs destinados à ferramenta. Todo o experimento ocorre diretamente no portal de transparência (interface web, acessível pelo navegador, a partir do endereço `http://localhost:4000`). Os resultados esperados são obtidos em no máximo 3 segundos após a invocação das respectivas funcionalidades.

## Pré-requisito
Para averiguar o funcionamento de algumas das funcionalidades abaixo, recomenda-se primeiro a criação de ao menos uma transação. Para isso, o sistema implementa um mecanismo de criação de tokens.

**Passo a passo:**
1. Na barra superior, clicar em "Login"
2. Inserir um nome qualquer de usuário, manter "Org 1" e clicar no botão azul escrito "Login". Caso o usuário já exista, a conta será acessada ao invés de criada.
3. Na tela de "Mint" (emissão), emitir tokens para o usuário recém-criado (campo "receiver") ou para outro usuário criado previamente. É possível atribuir qualquer identificador ao token ("Token ID") e emitir um número inteiro de tokens ("Amount").

**Resultado esperado:**
Após clicar no botão "Mint" no fim do formulário, recebe-se a resposta "Succesful mint!". Na tela "Balance", é possível verificar o seu saldo para o dado token, utilizando o mesmo "Token ID" da emissão.

**IMPORTANTE:**
O portal de transparência desempenha, dentre outras funções, o papel de tutorial da ferramenta. Após a criação da transação, sugere-se seguir esse tutorial (aba "Transparency"), do topo ao fim, lendo cada bloco de texto. Todas as reinvindicações a seguir podem ser obtidas durante esse processo.

## Detecção de modificação discreta
A ferramenta é capaz de detectar modificações discretas no conteúdo da blockchain, ou seja, quando há alterações no conteúdo de um dado bloco mas não há novo cálculo do hash do bloco (e dos blocos seguintes).

**Observação:**
O mecanismo de recalcular o encadeamento de hashes é executado automaticamente ao se abrir ou recarregar a página web do portal de transparência. A frase `The block hashes match those sent by the blockchain network! ✅`, no começo da interface, indica que o encadeamento está correto.

**Passo a passo (execução manual):**
Na aba "hash chain verification" do portal de transparência, inserir as palavras-chave "beginning" e "end" no primeiro e segundo campo, respectivamente. Isso fará com que todos os blocos desde o primeiro até o último sejam solicitados à rede blockchain (ou federação). Em seguida, o navegador calculará os hashes de todos os blocos e verificará se esses valores batem com os alegados pela federação.

**Resultado esperado:** mensagem `The block hashes match those sent by the blockchain network`.

## Detecção de cadeia alternativa e visão fragmentada
A ferramenta permite a detecção dos seguintes ataques:
- **Cadeia alternativa**: a federação modifica o conteúdo da blockchain e ajusta a cadeia de hashes, passando assim no teste de integridade do mecanismo de verificação da cadeia de hashes, acima.
- **Visão fragmentada**: dados diferentes são fornecidos a monitores distintos.

**Passo a passo:**
1. Na aba "IPFS" do portal de transparência, clicar em "publish current blockchain state to IPFS". Isso fará com que parte do estado atual da blockchain passe a existir na rede IPFS (local, nesta implementação) e, portanto, possa ser armazenada por entidades que não são a federação. Essa informação pode ser confrontada com a fornecida pela federação no futuro. Assim, caso ela realize ataques de cadeia alternativa ou visão fragmentada, haverá discrepância entre os dados fornecidos por ela e os contidos no IPFS.
2. É possível recuperar o conteúdo publicado no IPFS a partir de seu identificador (CID - Content Identifier). Para isso, adicione-o ao campo CID e clique em "request".
3. Também é possível verificar que o CID da última publicação do IPFS está vinculado a um endereço fixo (IPNS - Interplanetary Name System). Isso permite um modelo publish/subscribe entre federação e monitores. Para averiguar o vínculo entre o último CID e o endereço IPNS, clique no botão "retrieve IPNS content".


**Resultado esperado:**

Após a etapa 1, recarregue a página web. Você deve obter as seguintes mensagens:

`The block hashes match those sent by the blockchain network! ✅`

`The hash of the last tail published on IPFS (block #X) matches the hash of block #X provided by the blockchain network! ✅`

 O mecanismo de auditoria automática compara o hash do último bloco X adicionado ao IPFS com o hash do mesmo bloco retornado pela federação. Somando isso ao mecanismo de reconstrução do encadeamento de hashes (também executado automaticamente), verifica-se que não houve ataques de cadeia alternativa ou de visão fragmentada até o último bloco X publicado no IPFS. A intuição por trás da combinação desses dois mecanismos é que o bloco X é fornecido, em um cenário ideal, por uma entidade que não é a Federação. Caso houvesse alteração no bloco X ou algum anterior, o encadeamento de hashes não se satisfaria.

## Transparência de dados e detecção de transação inválida
**Passo a passo:**
Na aba "Blocks" do portal de transparência, solicite um bloco a partir de sua posição no encadeamento. Caso tenha emitido um token na tela Mint, existirão os blocos de 0 a 6. O conteúdo retornado corresponde aos metadados do bloco, às transações contidas nele e às assinaturas envolvidas nas transações (dos proponentes e nós envolvidos). Conforme explicado por [Kimura et al.](https://ieeexplore.ieee.org/document/10400478/), utilizando o mesmo contrato inteligente (código aberto) que a federação, um monitor experiente poderia simular as transações contidas nos blocos e verificar se os resultados são os mesmos alegados ali. Deste modo, é possível verificar se não existem transações inválidas nos blocos (i.e., não definidas no contrato inteligente).

Também é possível solicitar o world state (i.e., resumo da blockchain) a partir da aba "world state", para obter informações às claras sobre os dados contidos da blockchain.

**Resultado esperado:**
Transparência do conteúdo da blockchain.

## Detecção de contrato inteligente alternativo ou com código malicioso
Ao implantar-se um contrato inteligente na rede Fabric, é gerada uma transação contendo o hash do programa. Esta informação é armazenada na blockchain.

**Observação:**
A verificação do contrato é feita de maneira automática ao entrar ou recarregar o portal de transparência. O código é recuperado do GitHub e os blocos da blockchain são requisitados a fim de se procurar o hash do contrato em algum bloco. Caso o último hash de contrato na blockchain bata com o do código do GitHub, será exibida a mensagem `The file hash matches the latest smart contract deployment hash, in block x! ✅` no início da interface.

**Passo a passo (execução manual):**
1. Na aba "Smart contract verification" do portal de transparência, acessar o código-fonte do contrato inteligente através do link do GitHub.
2. Fazer download do arquivo "chaincode.tgz". Note que monitores experientes podem examinar o conteúdo do código em busca de trechos maliciosos que possam favorecer a federação. Isso pode ser feito manualmente ou a partir de ferramentas de auditoria como o [Mythril](https://github.com/ConsenSysDiligence/mythril).
3. Adicionar o arquivo no campo correspondente e clicar em "calculate hash".

**Resultado esperado:**
Mensagem `The file hash matches the latest smart contract deployment hash, in block x! ✅`

## Fork da blockchain
A partir dos world state contidos no IPFS, é possível estabelecer um mecanismo de recuperação da blockchain. No caso de uma aplicação baseada em ativos digitais, como a implementada aqui, o world state corresponde ao saldo das carteiras/usuários. Assim, caso seja detectado algum ataque por parte da federação (a partir dos mecanismos descritos acima), seria possível a recuperação da blockchain a estados prévios ao ataque. Para isso, um conjunto de entidades confiáveis poderia formar uma nova rede blockchain e recriar os ativos constatados em um world state anterior ao ataque.

# LICENSE

Este artefato possui licença Apache 2.0.
