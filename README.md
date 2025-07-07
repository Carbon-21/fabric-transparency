# Mecanismos de Transparência e Auditoria de Blockchains Permissionadas

Blockchains permissionadas, como as privadas e consorciadas, são comuns em contextos que demandam controle de acesso. Porém, ao restringir os participantes da rede, diminuem a transparência do sistema. Diante disso, este trabalho propõe uma ferramenta de auditoria de blockchains permissionadas baseada no compartilhamento descentralizado do estado da blockchain via Interplanetary File System (IPFS). A partir de uma implementação utilizando Hyperledger Fabric, foram desenvolvidos mecanismos que permitem que entidades externas à rede blockchain possam identificar e se recuperar de alterações indevidas, ataques de visão fragmentada, uso de contratos inteligentes distintos dos declarados pela rede e execução de transações inválidas. 

# Estrutura do README.md

Apresenta a estrutura do readme.md, descrevendo como o repositório está organizado.
...

# Selos Considerados

Todos os selos são considerados: Disponíveis, Funcionais, Sustentáveis e Reprodutíveis.

# Informações básicas
Para executar a ferrametna descrita no artigo e replicar os experimentos demosntrados no vídeo, será necessário rodar o código presente neste repositório. Com isso, será criada uma rede blockchain Hyperledger Fabric em containers Docker e o portal de transparência, com suporte a IPFS, será disponibilizada em uma interface web. Mais detalhes sobre, es~toa disponpivei na documentação ...

Recomenda-se o uso de uma máquina de ao menos 4Gb de memória e 2 CPUs. A maneira mais fácil de executar a ferramenta é através da máquina virtual (VM) disponibilizada EM... . Caso utilize a VM, recomenda-se que a máquina host tenha ao menos 8gb de memória, 4 CPUs e 20Gb livres para armazenamento da imagem da VM (Virtual Box). As dependência de software estão descritas na seção a seguir.


# Dependências

**Importante**: Ao usar a máquina virtual, todas as dependências abaixo já estão configuradas.

 Os seguintes requisitos de software são necessários para executar esta ferramenta:

- Docker 20.10.24+dfsg1
- Curl 7.88.1
- Go 1.19.8
- Node.js 22.15.0
- Npm 10.9.2
- Python 3.11.2
- Hyperledger Fabric 2.5.12

O sistema operacional recomendado é o **Debian 12**.


# Preocupações com segurança

A execução do artefato não ofereçe riscos aos avaliadores.


# Instalação

A seguir são descritas as etapas necessárias para se executar a aplicação, seja na VM ou não.

## Máquina Virtual

A forma mais fácil de usar esta ferramenta é através de uma máquina virtual:

1. Baixe o VirtualBox[https://www.virtualbox.org/wiki/Downloads]
2. Baixe a [imagem Debian](https://drive.google.com/file/d/1OcgcZKUsSEIYW5KWos6XiynpSzP4EttJ/view?usp=sharing) contendo a ferramenta
3. Extraia os arquivos
4. Clique no arquivo vbox. Isso deve carregar a máquina no VirtualBox
5. Ajuste os recursos da máquina em "settings" -> "general" -> "system". Recomendamos ao menos 4Gb e 2vCPUs, ou metade dos recursos disponíveis, idealmente

**Importante**: a **senha** para usar a VM é **1234**

## Código-fonte

Caso não deseje utilizar uma VM, primeiro baixe as dependências mencionadas na seção "dependências", de preferência em um sistema Debian 12. Em seguida, baixe a ferramenta:

```
git clone https://github.com/Carbon-21/fabric-transparency.git
```

## Como usar a ferramenta

Se estiver executando a VM, a blockchain e a ferramenta de transparência já devem estar ativas e funcionando. Caso não esteja utilizando a VM ou caso queira reinicializar a blockchain e a ferramenta, execute:

```
cd fabric-transparency OU cd ~/Documents/fabric-transparency (se estiver usando a VM)
chmod +x init
./init
```

Você deverá ver uma mensagem indicando que a ferramenta está disponível em `http://localhost:4000`. Após isso, poderá acessar o portal de transparência por esse endereço, em um navegador web.

# Teste mínimo

Após executar o comando `./init`descrito acima, duas mensagems indicam o funcionamento da ferramenta:
- "Blockchain up and running!": indica que a rede blockchain (rodando em container docker) está funcional
- "SERVER STARTED ... http://localhost:4000...": indica que a ferramenta de transparência está funcional através da interface web.

Após isso, ao abrir a interface web, os testes automáticos serão executados. As seguinte linha indicam que o sistema está funcional:
- The file hash matches the latest smart contract deployment hash, in block 2! ✅
- The block hashes match those sent by the blockchain network! ✅

# Experimentos


Esta seção deve descrever um passo a passo para a execução e obtenção dos resultados do artigo. Permitindo que os revisores consigam alcançar as reivindicações apresentadas no artigo.
Cada reivindicações deve ser apresentada em uma subseção, com detalhes de arquivos de configurações a serem alterados, comandos a serem executados, flags a serem utilizadas, tempo esperado de execução, expectativa de recursos a serem utilizados como 1GB RAM/Disk e resultado esperado.

Caso o processo para a reprodução de todos os experimentos não seja possível em tempo viável. Os autores devem escolher as principais reivindicações apresentadas no artigo e apresentar o respectivo processo para reprodução.

## Reivindicações #X

## Reivindicações #Y

# LICENSE

Este artefato posui licença GPL 3.0