<template>
  <div>
    <vs-navbar not-line center-collapsed>
      <template #left>
        <h1>D2.Sniffer</h1>
        <a href="https://github.com/RBlanchet" target="_blank">By RBlanchet</a>
      </template>
      <template #right>
        <vs-button flat success :disabled="isStarted" @click="isStarted = true">Démarrer l'écoute</vs-button>
        <vs-button flat danger :disabled="!isStarted" @click="isStarted = false">Stopper l'écoute</vs-button>
      </template>
    </vs-navbar>
    <div class="container">
      <vs-alert closable v-model="hideAlert">
        <template #title>Informations utiles</template>
        <p style="text-align: left">Si vous voulez analyser le contenu d'un <b>message</b>, stoppez le flux d'analyse.
          Celui ci mettra en pause l'analyse sur le Client, il ne coupera en aucun cas la connexion.</p>
      </vs-alert>
      <div class="items" v-if="events.length">
        <div
            class="item"
            :class="{
            'item__direction--client': event.direction === 'SERVER_TO_CLIENT',
            'item__direction--serveur': event.direction === 'CLIENT_TO_SERVER'
          }"
            v-for="(event , k) in events"
            :key="k"
        >
          <span class="item__number">#{{ events.length - k }}</span>
          <span class="item__direction">Direction: <p>{{ event.direction }}</p></span>
          <span class="item__id">ID: <p>{{ event.id }}</p></span>
          <span class="item__message">Message: <p>{{ event.name.split('.').pop() }}</p></span>
          <vs-button class="item__show" flat @click="showDetailContent = event.content">Voir le contenu</vs-button>
        </div>
      </div>
      <div class="no-content" v-else>
        Si vôtre Dofus est fonctionnel, les messages ne devrait pas tarder à arriver !
      </div>
    </div>
    <vs-dialog v-model="openDetailContent">
      <template #header>
        <h4 class="not-margin">Détail du contenu</h4>
      </template>
      <json-viewer :value="showDetailContent" copyables expand-depth="100"/>
    </vs-dialog>
  </div>
</template>

<script>
import JsonViewer from 'vue-json-viewer';

export default {
  name: 'Home',
  components: {JsonViewer},
  data: () => ({
    events: [],
    hideAlert: true,
    isStarted: true,
    notification: null,
    showDetailContent: null,
    toto: null,
  }),
  watch: {
    isStarted: function (value) {
      if (!value && !this.notification) {
        this.notification = this.$vs.notification({
          sticky: true,
          color: 'warn',
          duration: 'none',
          position: 'bottom-center',
          title: 'Ecoute en pause',
          text: 'L\'écoute est actuellement en pause, pour relancer recliquez sur la bouton dans la barre de navigation.'
        });
      } else if (this.notification) {
        this.notification.close();
        this.notification = null;
      }
    },
    showDetailContent: function (value) {
      console.log("showDetailContent", value)
    },
    toto: function (value) {
      console.log("toto", value)
    }
  },
  computed: {
    openDetailContent: {
      get: function () {
        return !!this.showDetailContent;
      },
      set: function () {
        this.showDetailContent = null;
      },
    },
  },
  mounted: function () {
    const socket = new WebSocket("ws://localhost:8088/messages");

    socket.onopen = () => {
      console.log('[Socket] Connecté');
    };

    socket.onmessage = event => {
      if (this.isStarted) {
        this.events.unshift(JSON.parse(event.data));
      }
    }
  }
}
</script>

<style lang="scss">
.vs-navbar {
  &__left {
    h1 {
      font-size: 24px;
      margin-right: 5px;
    }

    a {
      font-size: 12px;
      position: relative;
      top: 3px;
      color: #1b64f2;
      text-decoration: none;
    }
  }
}

.item {
  box-shadow: 0 2px 6px rgba(58, 57, 68, .2);
  background: #FFF;
  border-radius: 8px;
  margin-top: 15px;
  padding: 0px 15px;
  display: flex;
  align-items: center;
  border: 1px solid transparent;
  color: #9ca7b5;
  position: relative;

  &__number {
    color: #333;
    font-weight: 700;
    margin-right: 25px;
  }

  &__id {
    font-weight: 400;
    display: flex;
    align-items: center;
    margin-right: 50px;

    p {
      margin-left: 5px;
      color: #333333d9;
      font-weight: 600 !important;
    }
  }

  &__direction {
    font-weight: 400;
    display: flex;
    align-items: center;
    margin-right: 50px;

    p {
      margin-left: 5px;
      color: #333333d9;
      font-weight: 600 !important;
    }

    &--client {
      background: #f1f5f9ba;
    }
  }

  &__message {
    font-weight: 400;
    display: flex;
    align-items: center;
    margin-right: 50px;

    p {
      margin-left: 5px;
      font-weight: 600 !important;
      color: #1b64f2;
      text-decoration: none;
    }
  }

  &__show {
    position: absolute !important;
    right: 15px;
  }
}

.jv-container .jv-code {
  background: transparent;
  text-align: left;
}

.jv-node.toggle {
  margin-left: 25px !important;
}

.no-content {
  font-weight: 600;
  color: #3339;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50vh;
}

.container {
  margin-top: 100px;
}
</style>
