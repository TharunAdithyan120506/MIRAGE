import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

const TABLES = ['users','transactions','audit_log','admin_sessions','config','api_keys']

export default function PhpMyAdmin({ sessionId }) {
  const [selectedTable, setSelectedTable] = useState(null)
  const [tableData, setTableData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    axios.post(`${API}/honey/event`, { session_id: sessionId, path: '/phpmyadmin', signal: 'phpmyadmin_visit' }).catch(()=>{})
  }, [])

  const loadTable = async (table) => {
    setSelectedTable(table)
    setLoading(true)
    try {
      if (table === 'users') {
        const r = await axios.get(`${API}/api/users?session_id=${sessionId}`)
        setTableData(r.data.slice(0, 25))
      } else if (table === 'transactions') {
        const r = await axios.get(`${API}/api/transactions?session_id=${sessionId}`)
        setTableData(r.data.slice(0, 25))
      } else {
        // Fake data for other tables
        setTableData(Array.from({length:10},(_,i) => ({
          id: i+1,
          details: `${table} record ${i+1}`,
          created_at: new Date(Date.now()-i*86400000).toISOString().slice(0,19),
          status: 'active'
        })))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:'100vh',background:'#f5f5f5',fontFamily:'Arial,sans-serif',fontSize:13}}>
      {/* phpMyAdmin-style header */}
      <div style={{background:'#336699',padding:'8px 16px',display:'flex',alignItems:'center',gap:12}}>
        <span style={{color:'white',fontWeight:700,fontSize:16}}>phpMyAdmin</span>
        <span style={{color:'rgba(255,255,255,0.6)',fontSize:11}}>4.9.7</span>
        <span style={{marginLeft:'auto',color:'rgba(255,255,255,0.8)',fontSize:12}}>
          securebank_prod@prod-rds.internal
        </span>
      </div>

      <div style={{display:'flex',height:'calc(100vh - 40px)'}}>
        {/* Left sidebar */}
        <div style={{width:200,background:'#fff',borderRight:'1px solid #ccc',overflowY:'auto',padding:8}}>
          <div style={{background:'#336699',color:'white',padding:'6px 10px',fontSize:12,fontWeight:700,marginBottom:8,borderRadius:4}}>
            securebank_prod
          </div>
          {TABLES.map(t => (
            <div key={t} onClick={() => loadTable(t)} style={{
              padding:'6px 10px',cursor:'pointer',borderRadius:3,marginBottom:2,
              background:selectedTable===t?'#336699':'transparent',
              color:selectedTable===t?'white':'#336699',
              fontSize:12,fontFamily:'monospace'
            }}>
              📋 {t}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{flex:1,overflow:'auto',padding:16}}>
          {!selectedTable ? (
            <div>
              <div style={{background:'white',border:'1px solid #ccc',borderRadius:4,padding:16,marginBottom:16}}>
                <h3 style={{color:'#336699',marginBottom:8}}>Database: securebank_prod</h3>
                <p style={{fontSize:12,color:'#666'}}>MariaDB 10.6.12 — {TABLES.length} tables</p>
              </div>
              <table style={{width:'100%',background:'white',border:'1px solid #ccc',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#336699',color:'white'}}>
                    {['Table','Rows','Type','Collation','Size'].map(h=>(
                      <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:12}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[['users','12,847','InnoDB','utf8mb4_unicode_ci','4.2 MB'],
                    ['transactions','4,200,142','InnoDB','utf8mb4_unicode_ci','892 MB'],
                    ['audit_log','892,341','InnoDB','utf8mb4_unicode_ci','128 MB'],
                    ['admin_sessions','2,847','InnoDB','utf8mb4_unicode_ci','1.2 MB'],
                    ['config','42','InnoDB','utf8mb4_unicode_ci','16 KB'],
                    ['api_keys','128','InnoDB','utf8mb4_unicode_ci','32 KB']
                  ].map((row,i) => (
                    <tr key={i} style={{background:i%2?'#f0f4f8':'white',cursor:'pointer'}}
                      onClick={() => loadTable(row[0])}>
                      {row.map((cell,j) => (
                        <td key={j} style={{padding:'7px 12px',fontSize:12,
                          color:j===0?'#336699':'#333',fontFamily:j===0?'monospace':undefined,
                          borderBottom:'1px solid #ddd'}}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              <div style={{marginBottom:12,display:'flex',alignItems:'center',gap:12}}>
                <button onClick={() => setSelectedTable(null)} style={{
                  background:'#336699',color:'white',border:'none',padding:'4px 12px',
                  borderRadius:3,cursor:'pointer',fontSize:12}}>← Back</button>
                <h3 style={{color:'#336699',fontSize:14}}>
                  securebank_prod.<span style={{fontFamily:'monospace'}}>{selectedTable}</span>
                  <span style={{color:'#999',fontSize:12,fontWeight:400,marginLeft:8}}>
                    (showing {tableData.length} rows)
                  </span>
                </h3>
              </div>
              {loading ? (
                <div style={{textAlign:'center',padding:40,color:'#666'}}>Loading...</div>
              ) : tableData.length > 0 && (
                <div style={{overflowX:'auto'}}>
                  <table style={{borderCollapse:'collapse',background:'white',border:'1px solid #ccc',fontSize:11}}>
                    <thead>
                      <tr style={{background:'#336699',color:'white'}}>
                        {Object.keys(tableData[0]).map(k => (
                          <th key={k} style={{padding:'7px 12px',textAlign:'left',fontFamily:'monospace',fontWeight:600}}>
                            {k}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row,i) => (
                        <tr key={i} style={{background:i%2?'#f0f4f8':'white'}}>
                          {Object.values(row).map((v,j) => (
                            <td key={j} style={{padding:'6px 12px',borderBottom:'1px solid #ddd',
                              fontFamily:'monospace',maxWidth:200,overflow:'hidden',
                              textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                              {String(v)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
