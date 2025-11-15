import { IconButton } from "@mui/material";
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';

interface headerProps {
    title: string;
    subtitle: string;
}

function header(props: headerProps) {
    return (
        <>
        <div className="flex items-center p-4">
            <IconButton sx={{ color: 'black' }}>
                <SpaceDashboardOutlinedIcon />
            </IconButton>
            <div className="ml-3">
                <h1 className="font-bold text-2xl">{props.title}</h1>
                <h2 className="text-muted mt-1">{props.subtitle}</h2>
            </div>
        </div>

        <div className="w-full h-[1px] bg-gray-300 mt-2" />
        </>
    );
}

export default header;