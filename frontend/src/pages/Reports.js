import React, { useState, useEffect } from 'react';
import { Card, Spinner, Alert, Table } from 'react-bootstrap';
import { reportAPI } from '../services/api';
import { Bar } from 'react-chartjs-2';

const Reports = () => {
  const [monthlyCases, setMonthlyCases] = useState(null);
  const [judgePerformance, setJudgePerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [monthlyRes, performanceRes] = await Promise.all([
        reportAPI.getMonthlyCases(new Date().getFullYear()),
        reportAPI.getJudgePerformance()
      ]);
      setMonthlyCases(monthlyRes.data.data);
      setJudgePerformance(performanceRes.data.data.judges);
      setLoading(false);
    } catch (err) {
      setError('Failed to load reports');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading reports...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  const monthlyData = {
    labels: monthlyCases?.monthlyCases?.map(m => m.month) || [],
    datasets: [
      {
        label: 'Cases Registered',
        data: monthlyCases?.monthlyCases?.map(m => m.count) || [],
        backgroundColor: '#0d6efd'
      }
    ]
  };

  return (
    <div>
      <div className="page-header">
        <h2>Reports & Analytics</h2>
        <p className="text-muted">System performance and statistics</p>
      </div>

      <Card className="mb-4">
        <Card.Header>
          <h6 className="mb-0">Monthly Case Registration ({monthlyCases?.year})</h6>
        </Card.Header>
        <Card.Body>
          <Bar
            data={monthlyData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false }
              }
            }}
          />
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h6 className="mb-0">Judge Performance</h6>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th>Judge</th>
                  <th>Court</th>
                  <th>State</th>
                  <th>Active Cases</th>
                  <th>Closed Cases</th>
                  <th>Total Handled</th>
                  <th>Utilization</th>
                </tr>
              </thead>
              <tbody>
                {judgePerformance.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      No data available
                    </td>
                  </tr>
                ) : (
                  judgePerformance.map((judge, index) => (
                    <tr key={index}>
                      <td><strong>{judge.judge.name}</strong></td>
                      <td>{judge.judge.courtType}</td>
                      <td>{judge.judge.state}</td>
                      <td>{judge.activeCases}</td>
                      <td>{judge.closedCases}</td>
                      <td>{judge.totalCasesHandled}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="progress flex-grow-1 me-2" style={{ height: '20px' }}>
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{ width: `${judge.utilizationRate}%` }}
                              aria-valuenow={judge.utilizationRate}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            >
                              {judge.utilizationRate}%
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Reports;
