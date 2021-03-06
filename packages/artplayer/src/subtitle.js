import { setStyles, srtToVtt, vttToBlob, getExt } from './utils';
import assToVtt from './utils/assToVtt';

export default class Subtitle {
    constructor(art) {
        this.art = art;
        this.state = true;
        this.isInit = false;
        const { url } = this.art.option.subtitle;
        if (url) {
            this.init(url);
        }
    }

    init(url) {
        const {
            events: { proxy },
            option: { subtitle },
            template: { $video, $subtitle, $track },
        } = this.art;

        setStyles($subtitle, subtitle.style || {});

        if (!$track) {
            const $newTrack = document.createElement('track');
            $newTrack.default = true;
            $newTrack.kind = 'metadata';
            $video.appendChild($newTrack);
            this.art.template.$track = $newTrack;
        }

        this.load(url).then(url => {
            $subtitle.innerHTML = '';
            this.art.template.$track.src = url;
            this.art.emit('subtitle:load', url);

            if ($video.textTracks && $video.textTracks[0]) {
                const [track] = $video.textTracks;
                // eslint-disable-next-line no-inner-declarations
                function updateSubtitle() {
                    const [cue] = track.activeCues;
                    $subtitle.innerHTML = '';
                    if (cue) {
                        $subtitle.innerHTML = cue.text
                            .split(/\r?\n/)
                            .map(item => `<p>${item}</p>`)
                            .join('');
                    }
                    this.art.emit('subtitle:update', $subtitle);
                }

                if (!this.isInit) {
                    this.isInit = true;
                    proxy(track, 'cuechange', updateSubtitle.bind(this));
                }

                this.art.on('artplayerPluginSubtitle:set', updateSubtitle.bind(this));
            }
        });
    }

    load(url) {
        const { notice } = this.art;
        return fetch(url)
            .then(response => {
                return response.text();
            })
            .then(text => {
                const type = getExt(url);
                const formatText = text.replace(/{[\s\S]*?}/g, '');
                if (type === 'srt') {
                    return vttToBlob(srtToVtt(formatText));
                }
                if (type === 'ass') {
                    return vttToBlob(assToVtt(formatText));
                }
                return url;
            })
            .catch(err => {
                notice.show(err);
                throw err;
            });
    }

    set show(value) {
        const { $player } = this.art.template;
        if (value) {
            this.state = true;
            $player.classList.remove('artplayer-subtitle-hide');
            this.art.emit('subtitle:show');
        } else {
            this.state = false;
            $player.classList.add('artplayer-subtitle-hide');
            this.art.emit('subtitle:hide');
        }
    }

    toggle() {
        this.show = !this.state;
    }
}
