import './App.css';

import  {  pdfjs } from "react-pdf";
import React from 'react';
import { Button } from '@xbotvn/react-ui/core';
import Modal from './Modal';


const defaultUrl = "/InPhieuDieuTra.pdf";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`

function App({ src = defaultUrl }) {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  
  return (
    <div className="container">
       <div>
       <Button variant="outlined" color="primary" onClick={handleClickOpen}>
        Ký điện tử
      </Button>
      <Modal open={open} handleClose={handleClose}/>
       </div>
    </div>
  );

}

export default App;
