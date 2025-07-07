# TRANSPARENCY MECHANISMS FOR PERMISSIONED BLOCKCHAINS
Permissioned blockchains often lack privacy mechanisms for entities outside the blockchain network. To address that, this tool implements features that integrates Hyperledger Fabric 2.5, allowing external entities to audit blocks, smart contract deployments and other blockchain data. This can be done using a transparency portal and IPFS.

## Requirements
**Important**: When using the virtual machine, all of the dependencies below are already setup

To run this tool, you should have at least **4Gb of memory** available to have a Hyperledger Fabric blockchain network running on docker containers. The following software requirements were used during development, on **Debian 12**:

- Docker 20.10.24+dfsg1
- Curl 7.88.1
- Go 1.19.8
- Node.js 22.15.0
- Npm 10.9.2
- Python 3.11.2
- Hyperledger Fabric 2.5.12


## How to setup the environment

### Virtual Machine

The easiest way to use this tool is through a virtual machine:

1. Download VirtualBox
2. Download the [Debian image](https://drive.google.com/file/d/1OcgcZKUsSEIYW5KWos6XiynpSzP4EttJ/view?usp=sharing) containing the tool
3. Unzip the files
4. Click on the vbox file. This should load the machine on VirtualBox
5. Adjust the machine resources under "settings" -> "general" -> "system". We recommend at leat 4Gb and 2vCPUs, or half of the available resources, ideally

**Important**: the **password** to use the VM is **1234**
### Source code

If you do not want to use a VM, first dowload the dependencies aforementioned. Then download the tool:

```
git clone https://github.com/<anonymized>
```

## How to use the tool
If you are running the VM, the blockchain and the tool should be already up and running. If you are not using the VM or if you want to reinitialize the blockchain and the tool, run:

```
cd fabric-transparency OR cd ~/Documents/fabric-transparency (if you are using the VM)
chmod +x init
./init
```

You should get a message stating that the tool is available at `http://localhost:4000`. After that, you can access the transparency portal through that address, via a web browser.
