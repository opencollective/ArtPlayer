import { append, clamp, tooltip, setStyle, getStyle } from '../utils';

export default function volume(controlOption) {
    return art => ({
        ...controlOption,
        mounted: $control => {
            const {
                events: { proxy },
                icons,
                player,
                i18n,
            } = art;
            
            let isDroging = false;
            const $volume = append($control, icons.volume);
            const $volumeClose = append($control, icons.volumeClose);
            const $volumePanel = append($control, '<div class="art-volume-panel"></div>');
            const $volumeHandle = append($volumePanel, '<div class="art-volume-slider-handle"></div>');
            tooltip($volume, i18n.get('Mute'));
            setStyle($volumeClose, 'display', 'none');

            function volumeChangeFromEvent(event) {
                const { left: panelLeft, width: panelWidth } = $volumePanel.getBoundingClientRect();
                const { width: handleWidth } = $volumeHandle.getBoundingClientRect();
                const percentage =
                    clamp(event.pageX - panelLeft - handleWidth / 2, 0, panelWidth - handleWidth / 2) /
                    (panelWidth - handleWidth);
                return percentage;
            }

            function setVolumeHandle(percentage = 0.7) {
                if (player.muted || percentage === 0) {
                    setStyle($volume, 'display', 'none');
                    setStyle($volumeClose, 'display', 'flex');
                    setStyle($volumeHandle, 'left', '0');
                } else {
                    // TODO...
                    const panelWidth = getStyle($volumePanel, 'width') || 60;
                    const handleWidth = getStyle($volumeHandle, 'width');
                    const width = (panelWidth - handleWidth) * percentage;
                    setStyle($volume, 'display', 'flex');
                    setStyle($volumeClose, 'display', 'none');
                    setStyle($volumeHandle, 'left', `${width}px`);
                }
            }

            setVolumeHandle(player.volume);
            art.on('video:volumechange', () => {
                setVolumeHandle(player.volume);
            });

            proxy($volume, 'click', () => {
                player.muted = true;
            });

            proxy($volumeClose, 'click', () => {
                player.muted = false;
            });

            proxy($volumePanel, 'click', event => {
                player.muted = false;
                player.volume = volumeChangeFromEvent(event);
            });

            proxy($volumeHandle, 'mousedown', () => {
                isDroging = true;
            });

            proxy($volumeHandle, 'mousemove', event => {
                if (isDroging) {
                    player.muted = false;
                    player.volume = volumeChangeFromEvent(event);
                }
            });

            proxy(document, 'mouseup', () => {
                if (isDroging) {
                    isDroging = false;
                }
            });
        },
    });
}
