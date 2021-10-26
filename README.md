# D2.Sniffer

## Description

D2.Sniffer est une interface locale permettant de voir les paquets entrants/sortants sur le jeu Dofus 2.x.

Le sniffer se base sur le protocol de Dofus 2.x [D2.Protocol](https://github.com/RBlanchet/D2.Protocol).

## Installation

Copier et renommer le `.env.dist` en `.env` puis modifier le chemin de vôtre jeu. (Peut-être accessible dans le Launcher)

```shell
## Installation des modules utiles au Parser
npm install
## Installation des modules utiles pour l'interface Web
npm install --prefix app
```

## Utilisation

### Lancer le sniffer

```shell
npm start 
```

Dofus devrait se lancer, ainsi que le serveur Web dans votre navigateur (au cas où il se lancerais pas, la commande indique l'adresse du sniffer). Il vous suffit plus qu'a vous connecter au jeu et analyser les paquets !
