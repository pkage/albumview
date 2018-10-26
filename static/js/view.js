window.app = new Vue({
	el: '#app',
	data: {
		tracks: [],
		showLoadMore: false
	},
	mounted: function() {
		this.fetchTracks()
	},
	methods: {
		computeImage: function(track) {
			return {
				backgroundImage: `url('${track.track.album.images[1].url}')`
			}
		},
		computeArtists: function(track) {
			return track.track.artists.map(a => a.name).join(', ')
		},
		harshReload: function() {
			fetch('/refresh_token')
				.then(() => this.fetchTracks())
		},
		fetchTracks: function() {
			fetch(`/tracks?offset=${this.tracks.length}`, {
				cache: 'no-store'
			})
				.then(r => r.json())
				.then(r => {
					try {
						this.showLoadMore = r.items.length > 0
						this.tracks = this.tracks.concat(r.items)
						if (this.tracks.length === 0) {
							this.harshReload()
						}
					} catch (e) {
						this.harshReload()
					}
				})
		}
	}
})
