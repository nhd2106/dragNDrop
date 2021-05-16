import React, { useCallback, useEffect, useRef, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import Slide from "@material-ui/core/Slide";
import FileSaver from "file-saver";
import Dropzone from "react-dropzone";
import {
  DialogActions,
  DialogContent,
  Button,
  Icon,
} from '@xbotvn/react-ui/core';

import interact from "interactjs";
import { PDFDocument } from "pdf-lib";
import * as pdfjs from "pdfjs-dist";
import {
  ondropActivate,
  onDragEnter,
  onDragLeave,
  onDropDeacTivate,
} from './utils';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const useStyles = makeStyles((theme) => ({
  appBar: {
    position: "relative",
  },
  title: {
    marginLeft: theme.spacing(2),
    flex: 1,
  },
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function FullScreenDialog({
  open,
  handleClickOpen,
  handleClose,
  children,
}) {
  const classes = useStyles();
  const [pdf, setPDF] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [canvasRef, setCanvasRef] = useState({});
  const [file, setFile] = useState();
  const [signature, setSignature] = useState();
  const outerRef = useRef();
  const viewerRef = useRef();
  const tempRef = useCallback((node) => {
    setCanvasRef({
      current: node,
    });
  }, []);
  const imageOuterRef = useRef();
  const signatureRef = useRef();
  const imageRef = useRef();

  const dialogRef = document.querySelector('.dialogcontent');

  /*only use for checking pdf positon in this temp app*/
  const modifyPdf = async () => {
    const signatureWidth = signatureRef?.current?.offsetWidth;
    const maxPDFy = canvasRef?.current?.height;
    const offsetY = 90; // offset height (dialog actions and tilte)
    const { x, y } = imageOuterRef?.current?.dataset ?? 0;
    const pdfY = parseFloat(y);
    const offsetHeight = imageRef?.current?.height ?? imageOuterRef?.current?.clientHeight ?? 0;
    const defaultPY = maxPDFy - offsetY - dialogRef?.scrollTop - offsetHeight;
    const pY = maxPDFy - offsetY - pdfY - offsetHeight - 8 - dialogRef?.scrollTop; //8PX IS PDF BORDER
    const pX = parseFloat(x) - signatureWidth - 8;

    if(signature) {
      const jpgImageBytes = await fetch(signature).then((res) => {
        return res.blob();
      });
  
      const temp = await jpgImageBytes.arrayBuffer().then((buffer) => buffer);
      const unit8jpgbytes = new Uint8Array(temp);
      const pdfDoc = await PDFDocument.load(file);
  
      const jpgImage = jpgImageBytes.type.includes("jpeg")
        ? await pdfDoc.embedJpg(unit8jpgbytes)
        : await pdfDoc.embedPng(unit8jpgbytes);
      const pages = pdfDoc.getPages();
      const page = pages[currentPage - 1];
      //******************************* SIGN PARAMS******************************* */
      page.drawImage(jpgImage, {
        x: pX || 0,
        y: pY || defaultPY,
        width: imageRef?.current?.width ?? imageOuterRef?.current?.clientWidth,
        height: imageRef?.current?.height ?? imageOuterRef?.current?.clientHeight,
      });
      const pdfBytes = await pdfDoc.save();
    var bytes = new Uint8Array(pdfBytes);
    const blob = new Blob([bytes]);
    FileSaver.saveAs(blob, "test.pdf");
    } else alert(`x: ${pX || 0}, y: ${pY || defaultPY},
      width: ${imageRef?.current?.width ?? imageOuterRef?.current?.clientWidth},
      height: ${imageRef?.current?.height ?? imageOuterRef?.current?.clientHeight},
      page: ${currentPage}
    `)
    
  };

  // Render pdf
  const renderPage = useCallback(
    async ({ pdfDoc, pageNum }) => {
      const page = await pdfDoc.getPage(pageNum);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        const viewport = page.getViewport({ scale: 1 });
        canvasRef.current.width = viewport.width;
        canvasRef.current.height = viewport.height;
        page.render({
          canvasContext: ctx,
          viewport: viewport,
        });
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.width);
          ctx.beginPath();
        }
      }
    },
    [canvasRef]
  );

  useEffect(() => {
    const fetchPdf = async () => {
      if (file) {
        const data = new Uint8Array(file);
        const loadingTask = pdfjs.getDocument({ data });

        const pdfDoc = await loadingTask.promise;

        setPDF(pdfDoc);

        setNumPages(pdfDoc._pdfInfo.numPages);

        renderPage({ pdfDoc, pageNum: 1, scale: 1 });
      }
    };
    fetchPdf();
  }, [renderPage, canvasRef, file]);

  ///// interactjs library
  const position = { x: 0, y: 0 };
  function dragMoveListener(event) {
    const target = event.target;
    position.x += event.dx;
    position.y += event.dy;
    target.setAttribute("data-x", position.x);
    target.setAttribute("data-y", position.y);
    event.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
  }
  interact('.dropzone').dropzone({
    accept: '.drag-drop',
    overlap: 1,
    ondropactivate: ondropActivate,
    ondragenter: onDragEnter,
    ondragleave: onDragLeave,
    ondropdeactivate: onDropDeacTivate,
  });
  interact('.drag-drop')
    .draggable({
      inertia: true,
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: '#selectorContainer',
          endOnly: true,
          elementRect: {
            top: 0, left: 0, bottom: 1, right: 1,
          },
        }),
      ],
      autoScroll: true,
      onmove: dragMoveListener,
    })
    .resizable({
      edges: {
        top: true, left: true, bottom: true, right: true,
      },
      listeners: {
        move(event) {
          let { x, y } = event.target.dataset;
          x = (parseFloat(x) || 0) + event.deltaRect.left;
          y = (parseFloat(y) || 0) + event.deltaRect.top;
          Object.assign(event.target.style, {
            width: `${event.rect.width}px`,
            height: `${event.rect.height}px`,
            transform: `translate(${x}px, ${y}px)`,
          });
          Object.assign(event.target.dataset, { x, y });
        },
      },
    });

  const prevPage = () => {
    if (currentPage > 1) {
      renderPage({ pdfDoc: pdf, pageNum: currentPage - 1 });
      setCurrentPage(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (currentPage < numPages) {
      renderPage({ pdfDoc: pdf, pageNum: currentPage + 1 });
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div>
      <Dialog
        fullScreen
        open={open}
        onClose={handleClose}
        TransitionComponent={Transition}
        style={{
          padding: 0,
        }}
      >
        <AppBar className={classes.appBar}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <DialogContent
          style={{
            padding: 0,
          }}
          className="dialogcontent"
        >
          <div
            className="viewer"
            spacing={2}
            id="selectorContainer"
            ref={viewerRef}
          >
            <div>
              <div ref={signatureRef}>
                <div>
                  <p
                    ref={imageOuterRef}
                    className="drag-drop "
                    style={{
                      display: "inlineBlock",
                    }}
                  >
                    {
                      signature ? <img
                      className="signature"
                      ref={imageRef}
                      width="100%"
                      height="100%"
                      src={signature}
                      alt="signature"
                    /> : 'vị trí chữ ký'
                    }
                  </p>
                </div>
              </div>
              <div></div>
            </div>
            <div>
              <div className="canvas-container" ref={outerRef}>
                <div className="dropzone">
                  <canvas ref={tempRef} />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Dropzone
            onDrop={(files) => {
              if (files.length) {
                const reader = new FileReader();
                reader.onload = () => {
                  setFile(reader.result);
                };
                reader.readAsArrayBuffer(files[0]);
              }
            }}
          >
            {({ getRootProps, getInputProps }) => (
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <button>tải lên file</button>
              </div>
            )}
          </Dropzone>
          <Dropzone
            onDrop={(files) => {
              if (files.length) {
                const reader = new FileReader();
                reader.onload = () => {
                  setSignature(reader.result);
                };
                reader.readAsDataURL(files[0]);
              }
            }}
          >
            {({ getRootProps, getInputProps }) => (
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <button>tải lên chữ ký</button>
              </div>
            )}
          </Dropzone>
          {
            numPages > 1 ? (
              <>
                <Button onClick={prevPage} size="small">
                  <Icon>skip_previous</Icon>
                </Button>
                <Button onClick={nextPage} size="small">
                  <Icon>skip_next</Icon>
                </Button>
              </>
            ) : null
          }
          <div className="pagination">
            Trang
          {currentPage}
          /
          {numPages}
          </div>
           {/*only use for checking pdf positon in this temp app*/}
          <button onClick={() => modifyPdf()}>tải về</button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
