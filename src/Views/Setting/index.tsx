import ToggleButton from '@Components/ToggleButton';
import styles from './style.module.less';
import ListBox from '@Components/ListBox';
import { useMainStore } from '@Stores/index';
import { observer } from 'mobx-react-lite';
import React from 'react';

const Setting = observer(() => {
    const mainStore = useMainStore();

    const settingList = [
        {
            name: '스타일러 사용',
            values: [
                {
                    type: 'toggle',
                    value: mainStore.setting.get('enable'),
                    cb: (value: unknown) => mainStore.setSetting('enable', value, true)
                }
            ]
        },
        {
            name: '채팅창 스타일',
            values: [
                {
                    type: 'list',
                    value: mainStore.setting.get('chat_style'),
                    cb: (value: unknown) => mainStore.setSetting('chat_style', value, true)
                }
            ]
        }
    ];

    const settingListElem = settingList.map(({ name, values }, idx) => {
        const valueElem = values.map(({ type, value, cb }, idx) => {

            let contentElem;
            switch (type) {
                case 'toggle':
                    contentElem = <ToggleButton enable={value} setEnable={cb} />;
                    break;
                case 'list':
                    contentElem = <ListBox />;
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