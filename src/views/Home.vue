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
      <vs-input class="radio-group-full-width" v-model="jsonPathLiveFilter" label-placeholder="Search events..."/>
      <div class="row">
        <div class="items column" v-if="filteredEvents.length">
          <div
              class="item"
              :class="{
            'item__direction--client': event.direction === 'SERVER_TO_CLIENT',
            'item__direction--serveur': event.direction === 'CLIENT_TO_SERVER'
          }"
              v-for="(event , k) in filteredEvents"
              :key="k"
          >
            <span class="item__number">#{{ event.uid }}</span>
            <span class="item__direction">Direction: <p>{{
                event.direction === 'SERVER_TO_CLIENT' ? 'S -> C' : 'C -> S'
              }}</p></span>
            <span class="item__id">ID: <p></p></span>
            <span class="item__message">Message: <p>{{ event.name.split('.').pop() }} </p> ({{ event.id }})</span>
            <vs-button class="item__show" flat @click="selectEvent(event)">🔎</vs-button>
          </div>
        </div>
        <div class="no-content column" v-else>
          Nothing received for the moment
        </div>
        <div class="column">
          <json-viewer :value="jsonToDisplay" expanded copyable/>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import JsonViewer from 'vue-json-viewer';
import {JSONPath} from 'jsonpath-plus'

function getDisplayableContent(data) {
  if (!data) return data
  // eslint-disable-next-line no-prototype-builtins
  if (data.hasOwnProperty("_schema")) {
    delete data._schema
  }
  if (data instanceof Array) {
    for (const [index, value] of data.entries()) {
      data[index] = getDisplayableContent(value)
    }
  } else if (data instanceof Object) {
    for (const fieldName in data) {
      let cleaned = getDisplayableContent(data[fieldName]);
      if (fieldName === "_parent") {
        delete data._parent
        data = {
          ...cleaned,
          ...data,
        }
      } else {
        data[fieldName] = cleaned
      }
    }
  }
  return data
}

export default {
  name: 'Home',
  components: {JsonViewer},
  data: () => ({
    allEvents: [
    /*  {
        direction: 'SERVER_TO_CLIENT',
        name: 'toto',
        id: 111,
        uid: 1,
        content: {
          f1: "yolo",
          f2: 123
        },
      },
      {
        direction: 'CLIENT_TO_SERVER',
        name: 'tata',
        id: 222,
        uid: 2,
        content: {
          f1: "yolo",
          f2: 444
        },
      }*/
    ],
    filteredEvents: [],
    filterExamples: [
        "$[?(@.name=='toto')]"
    ],
    hideAlert: true,
    isStarted: true,
    notification: null,
    jsonToDisplay: {},
    nextEventUid: 1,
    jsonPathLiveFilter: ""
  }),
  methods: {
    selectEvent: function (event) {
      this.jsonToDisplay = getDisplayableContent(event.content)
    },
    updateFilteredEvents: function () {
      this.filteredEvents = this.allEvents.filter(this.isFiltered)
    },
    isFiltered: function (event) {
      try {
        let result = JSONPath({
          json: [JSON.parse(JSON.stringify(event))],
          path: this.jsonPathLiveFilter == null || this.jsonPathLiveFilter === "" ? "$" : this.jsonPathLiveFilter,
          wrap: false
        });
        return result !== undefined
      } catch (e) {
        return true
      }
    },
    onNewMessage: function (event) {
      event.uid = this.nextEventUid++
      this.allEvents.unshift(event)
      if (this.isFiltered(event)) {
        this.filteredEvents.unshift(event)
      }
    }
  },
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
    jsonPathLiveFilter: function () {
      this.updateFilteredEvents()
    },
  },
  mounted: function () {
    this.jsonPathLiveFilter = "$"
    const socket = new WebSocket("ws://localhost:8088/messages");

    socket.onopen = () => {
      console.log('[Socket] Connecté');
    };

    socket.onerror = (e) => {
      console.log('[Socket] error', e);
    };

    socket.onclose = (e) => {
      console.log('[Socket] closed', e);
    };

    socket.onmessage = event => this.onNewMessage(JSON.parse(event.data))
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

.row {
  display: flex;
}

.column {
  flex: 50%;
}

.radio-group-full-width > input {
  width: 100%
}

.radio-group-full-width > label {
  width: 100%
}
</style>
