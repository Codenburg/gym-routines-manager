(async () => {
  const response = await fetch('http://localhost:3000/api/rutinas');
  const result = await response.json();
  const fb = result.data.find((r: any) => r.nombre.includes('Full Body') && !r.nombre.includes('Ligero'));
  console.log(`Nombre: ${fb.nombre}, Tipo: ${fb.tipo}`);
})();
