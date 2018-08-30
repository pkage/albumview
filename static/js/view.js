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
		fetchTracks: function() {
			fetch(`/tracks?offset=${this.tracks.length}`)
				.then(r => r.json())
				.then(r => {
					this.showLoadMore = r.items.length > 0
					this.tracks = this.tracks.concat(r.items)
					if (r.items === undefined || r.length === 0 || this.tracks.length === 0) {
						fetch('/refresh_token')
						setTimeout(3000, () => window.location.reload(true))
						return
					}
				})
		}
	}
})
