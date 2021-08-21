new Vue({
  el: '#app',
  mounted: async function () {
    const initialHash = '11d9b097ac960bd2c6c131fa';
    let hashHex = []
    initialHash.split('').forEach(i => {
      hashHex.push({value: i, match: true})
    })
    this.hashA = hashHex
    this.hashB = hashHex
    await this.loadModel();
    this.isLoading = false
  },
  data: function () {
    return {
      hashA: [],
      hashB: [],
      model: null,
      seed: tf.tensor(seed).reshape([96, 128]),
      isLoading: true,
      isLoadingA: false,
      isLoadingB: false,
    }
  },
  methods: {
    async loadModel () {
      const MODEL_URL = './assets/model/model.json';
      this.model = await tf.loadGraphModel(MODEL_URL);
      await this.getNeuralhash('image-a')
      await this.getNeuralhash('image-b')
    },
    async getNeuralhashHelper (imageId) {
      this.isLoadingA = true
      this.isLoadingB = true
      await this.sleep(10)
      await this.getNeuralhash(imageId)
      this.isLoadingA = false
      this.isLoadingB = false
    },
    async getNeuralhash (imageId) {
      let input = tf.browser.fromPixels(document.getElementById(imageId));
      input = tf.image.resizeBilinear(input, [360, 360]).transpose([2, 0, 1]).reshape([1, 3, 360, 360]);
      input = input.div(tf.scalar(255)).mul(tf.scalar(2)).sub(tf.scalar(1))
      let hash_t = tf.dot(this.seed, this.model.predict(input).reshape([128]))

      let hash = '';
      Array.from(hash_t.dataSync()).forEach(i => {
          if (i >= 0) hash += '1'
          else hash += '0'
      })

      let hashHexA = [];
      let hashHexB = []
      for (let i=0; i*4<hash.length; i++) {
        let targetHash = this.hashA
        if (imageId === 'image-a') {
          targetHash = this.hashB
        }
        let value = parseInt(hash.substr(i*4, 4), 2).toString(16)
        hashHexA.push({
          value: imageId === 'image-a' ? value : this.hashA[i].value,
          match: targetHash[i].value === value
        })
        hashHexB.push({
          value: imageId === 'image-b' ? value : this.hashB[i].value,
          match: targetHash[i].value === value
        })
      }
      this.hashA = hashHexA
      this.hashB = hashHexB
    },
    async loadFile (event, imageId) {
      document.getElementById(imageId).src = URL.createObjectURL(event.target.files[0]);
      await this.sleep(100)
      await this.getNeuralhashHelper(imageId)
    },
    click (inputId) {
      document.getElementById(inputId).click()
    },
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }
})