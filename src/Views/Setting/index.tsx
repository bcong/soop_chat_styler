import ToggleButton from '@Components/ToggleButton';
import styles from './style.module.less';
import ListBox from '@Components/ListBox';
import { useMainStore } from '@Stores/index';
import { observer } from 'mobx-react-lite';
import { I_OPTION, I_SETTINGS } from '@Types/index';
import InputBox from '@Components/InputBox';
import SliderBar from '@Components/SliderBar';

const Setting = observer(() => {
    const mainStore = useMainStore();

    const opitons: I_OPTION[] = [
        {
            key: 0,
            name: '오버레이'
        },
        {
            key: 1,
            name: '프레임'
        }
    ];

    const settingList: I_SETTINGS[] = [
        {
            name: '스타일러 활성화',
            values: [
                {
                    type: 'toggle',
                    value: mainStore.setting.get('enable'),
                    cb: (value: unknown) => mainStore.setSetting('enable', value, true)
                }
            ]
        },
        {
            name: '기존 채팅 활성화',
            values: [
                {
                    type: 'toggle',
                    value: mainStore.setting.get('defalut_chat_enable'),
                    cb: (value: unknown) => mainStore.setSetting('defalut_chat_enable', value, true)
                }
            ]
        },
        {
            name: '채팅창 스타일',
            values: [
                {
                    type: 'list',
                    value: mainStore.setting.get('chat_style'),
                    options: opitons,
                    cb: (value: unknown) => mainStore.setSetting('chat_style', value, true)
                }
            ]
        },
        {
            name: '채팅 표시 개수',
            values: [
                {
                    type: 'slider',
                    value: mainStore.setting.get('overlay_view_count'),
                    min: 1,
                    max: 20,
                    cb: (value: unknown) => mainStore.setSetting('overlay_view_count', value, true)
                }
            ]
        }
    ];

    const settingListElem = settingList.map(({ name, values }, idx) => {
        const valueElem = values.map(({ type, value, options, inputType, min, max, cb }, idx) => {

            let contentElem;
            switch (type) {
                case 'toggle':
                    contentElem = <ToggleButton enable={value} setEnable={cb} />;
                    break;
                case 'list':
                    contentElem = <ListBox value={value} options={options as I_OPTION[]} setValue={cb} />;
                    break;
                case 'input':
                    contentElem = <InputBox value={value} setValue={cb} type={inputType} min={min} max={max} />;
                    break;
                case 'slider':
                    contentElem = <SliderBar value={value} setValue={cb} min={min} max={max} />;
                    break;
            }

            return (

                <div key={idx} className={styles.Value}>
                    {contentElem}
                </div>

            );
        });

        return (
            <div key={idx} className={styles.Menu}>
                <div className={styles.Name}>
                    <p>
                        {name}
                    </p>
                </div>
                {valueElem}
            </div>
        );
    });

    return (
        <div className={styles.Setting}>
            <div className={styles.Menus}>
                {settingListElem}
            </div>
        </div>
    );
});

export default Setting;