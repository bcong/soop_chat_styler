import styles from './style.module.less';

const ListBox = () => {
    const testList = [

    ];

    return (
        <div className={styles.ListBox}>
            <div className={styles.ListValue}>
                <p>
                    현재값현재값현재값현재값현재값현재값현재값
                </p>
            </div>
            <div className={styles.List}>
                <div className={styles.Option}>

                </div>
            </div>
        </div>
    );
};

export default ListBox;