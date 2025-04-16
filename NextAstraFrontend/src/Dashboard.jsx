import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Stage, Layer, Rect, Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';
import { useNavigate } from "react-router-dom";
function URLImage({ src, ...props }) {
  const [image] = useImage(src);
  return <KonvaImage image={image} {...props} />;
}

function Dashboard() {
  const [image, setImage] = useState(null);
  const [imageURL, setImageURL] = useState('');
  const [imageId, setImageId] = useState('');
  const [rectangles, setRectangles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const navigate = useNavigate();
  const transformerRef = useRef();
  const layerRef = useRef();

  const handleUpload = async () => {
    try {
      const formData = new FormData();
      formData.append('image', image);

      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': localStorage.getItem('token')
        }
      });

      const imagePath = res.data.image.imagePath;
      setImageURL(`http://localhost:5000/${imagePath}`);
      setImageId(res.data.image._id);
      setRectangles([]);
    } catch (err) {
      console.error("Upload failed//", err);
    }
  };

  // Add New//////////////
  const handleAddRectangle = () => {
    const newRect = {
      id: Date.now().toString(),
      x: 50,
      y: 50,
      width: 100,
      height: 100
    };
    setRectangles([...rectangles, newRect]);
  };
// .............Select react
  const handleSelect = (id) => {
    setSelectedId(id);
  };

  const handleTransformEnd = (e, rect) => {
    const node = e.target;
    const updatedRects = rectangles.map(r =>
      r.id === rect.id
        ? {
            ...r,
            x: node.x(),
            y: node.y(),
            width: node.width() * node.scaleX(),
            height: node.height() * node.scaleY()
          }
        : r
    );

    // Reset scale
    node.scaleX(1);
    node.scaleY(1);

    setRectangles(updatedRects);
  };

  // Delete selected rectangle
  const handleDelete = () => {
    if (selectedId) {
      setRectangles(rectangles.filter(rect => rect.id !== selectedId));
      setSelectedId(null);
    }
  };

  // Save boundaries to backend
  const handleSaveBoundaries = async () => {
    try {
      if (rectangles.length === 0) {
        alert("No boundaries to save.");
        return;
      }
  
      await axios.post(
        `http://localhost:5000/api/save-boundaries/${imageId}`,
        { boundaries: rectangles },
        {
          headers: {
            'Authorization': localStorage.getItem('token')
          }
        }
      );
      alert("Boundaries saved successfully!");
    } catch (err) {
      console.error("Saving boundaries failed:", err);
      alert("Failed to save boundaries.");
    }
  };
  
  
  

  // Apply transformer to selected rect
  useEffect(() => {
    if (transformerRef.current && selectedId) {
      const selectedNode = layerRef.current.findOne(`#${selectedId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId]);
  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove token
    navigate("/"); 
  };
  return (
    <div className="p-6">
      <div className='flex justify-between mb-4'>

      <h2 className="text-2xl font-semibold text-center text-red-600 mb-6">Image Boundary Editor</h2>
      <button
      onClick={handleLogout}
      className="bg-blue-600 px-3 py-2 text-white font-semibold border rounded-lg"
    >
      Logout
    </button>
      </div>

      <div className="mb-4">
        <input 
          type="file" 
          onChange={e => setImage(e.target.files[0])}
          className="block mb-4 p-2 border rounded-lg w-96"
        />
      </div>

      <div className="flex justify-between gap-4 mb-4">
        <button 
          onClick={handleUpload} 
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Upload
        </button>
        <button 
          onClick={handleAddRectangle} 
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Add Boundary
        </button>
        <button 
          onClick={handleDelete} 
          disabled={!selectedId} 
          className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
        >
          Delete Selected
        </button>
        <button 
          onClick={handleSaveBoundaries} 
          disabled={rectangles.length === 0} 
          className="px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
        >
          Save Boundaries
        </button>
      </div>

    {/* Display an Image */}

      <div className="mt-6">
        {imageURL && (
          <Stage width={800} height={600}>
            <Layer ref={layerRef}>
              <URLImage src={imageURL} x={0} y={0} width={400} height={400} />
              {rectangles.map((rect) => (
                <Rect
                  key={rect.id}
                  id={rect.id}
                  {...rect}
                  fill="rgba(0,255,0,0.3)"
                  stroke="green"
                  strokeWidth={2}
                  draggable
                  onClick={() => handleSelect(rect.id)}
                  onTap={() => handleSelect(rect.id)}
                  onTransformEnd={(e) => handleTransformEnd(e, rect)}
                  onDragEnd={(e) => handleTransformEnd(e, rect)}
                />
              ))}
              <Transformer ref={transformerRef} />
            </Layer>
          </Stage>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
