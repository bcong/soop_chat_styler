import { classes } from '@Utils/index';
import styles from './style.module.less';

interface I_PROPS {
    enable: boolean
    setEnable: (isOn: boolean) => void
}

const ToggleButton: React.FC<I_PROPS> = ({
    enable,
    setEnable
}) => {

    const handleToggle = () => {
        setEnable(!enable);
    };

    return (
        <div className={styles.ToggleButton} onClick={handleToggle}>
            <div className={classes(styles.Circle, enable ? styles.Enable : false)}>

            </div>
        </div>
    );
};

export default ToggleButton;